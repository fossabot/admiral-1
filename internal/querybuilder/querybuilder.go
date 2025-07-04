package querybuilder

import (
	"encoding/base64"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	DefaultLimit   int32 = 50
	MaxResultLimit int32 = 1000
)

type QueryBuilder interface {
	ParseFilter(string) (string, map[string]interface{}, error)
	PaginatedQuery(string, int32, *string) func(*gorm.DB) *gorm.DB
}

type queryBuilder struct {
	columns []string // Whitelisted columns for filtering
}

// New creates a new QueryBuilder instance with the specified columns
func New(columns []string) QueryBuilder {
	defaultCols := []string{"id", "metadata", "created_at"}
	colMap := map[string]bool{}
	for _, c := range columns {
		colMap[c] = true
	}

	for _, d := range defaultCols {
		if !colMap[d] {
			columns = append(columns, d)
		}
	}

	return &queryBuilder{
		columns: columns,
	}
}

func (qb *queryBuilder) ParseFilter(filter string) (string, map[string]interface{}, error) {
	if len(filter) == 0 {
		return "", nil, nil
	}

	res, err := ParseReader("", strings.NewReader(filter))
	if err != nil {
		return "", nil, fmt.Errorf("failed to parse filter: %w", err)
	}

	q, ok := res.(*Query)
	if !ok {
		return "", nil, errors.New("unable to parse query into expected structure")
	}

	var aq strings.Builder
	av := make(map[string]interface{})

	for i, af := range q.AndFields {
		var name string
		k := af.Key

		switch k.Kind {
		case "field":
			if !slices.Contains(qb.columns, k.Name) {
				return "", nil, fmt.Errorf("query field '%s' is not whitelisted", k.Name)
			}
			name = k.Name
		case "meta":
			var sb strings.Builder
			sb.WriteString("metadata -> ")
			parts := strings.Split(k.Name, ".")
			for i, j := range parts {
				if i > 0 {
					sb.WriteString(" ->> ")
				}
				sb.WriteString("'" + j + "'")
			}
			name = sb.String()
		default:
			return "", nil, fmt.Errorf("query field '%s' has an unknown kind", k.Name)
		}

		if i > 0 {
			aq.WriteString(" AND ")
		}

		switch af.Operation {
		case "~=":
			aq.WriteString(fmt.Sprintf("%s ILIKE @%s", name, name))
			av[name] = fmt.Sprintf("%%%s%%", af.Value)
		case "=":
			if val, ok := af.Value.(string); ok {
				if _, err := uuid.Parse(val); err == nil {
					aq.WriteString(fmt.Sprintf("%s = @%s", name, name))
				} else {
					aq.WriteString(fmt.Sprintf("%s ILIKE @%s", name, name))
				}
				av[name] = val
			} else {
				aq.WriteString(fmt.Sprintf("%s = @%s", name, name))
				av[name] = af.Value
			}
		default:
			aq.WriteString(fmt.Sprintf("%s %s @%s", name, af.Operation, name))
			av[name] = af.Value
		}
	}

	return aq.String(), av, nil
}

func (qb *queryBuilder) PaginatedQuery(filter string, limit int32, pageToken *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		wq, wv, err := qb.ParseFilter(filter)
		if err != nil {
			_ = db.AddError(err)
			return db
		}

		if pageToken != nil {
			decoded, err := base64.RawURLEncoding.DecodeString(*pageToken)
			if err != nil {
				_ = db.AddError(fmt.Errorf("invalid page token encoding: %w", err))
				return db
			}

			parts := strings.Split(string(decoded), "|")
			if len(parts) != 2 {
				_ = db.AddError(fmt.Errorf("invalid page token format"))
				return db
			}

			ts, err := strconv.ParseInt(parts[0], 10, 64)
			if err != nil {
				_ = db.AddError(fmt.Errorf("invalid timestamp in page token: %w", err))
				return db
			}

			cursorTime := time.Unix(ts, 0)
			cursorID := parts[1]
			cursorCondition := `((created_at > @cursorTime) OR (created_at = @cursorTime AND id >= @cursorID))`

			if len(wq) > 0 {
				wq += " AND " + cursorCondition
			} else {
				wq = cursorCondition
			}
			if wv == nil {
				wv = make(map[string]interface{})
			}
			wv["cursorTime"] = cursorTime
			wv["cursorID"] = cursorID
		}

		if len(wq) > 0 {
			db = db.Where(wq, wv)
		}

		// Validate and set the limit.
		queryLimit := DefaultLimit
		if limit > MaxResultLimit {
			_ = db.AddError(fmt.Errorf("maximum query limit is %d", MaxResultLimit))
			return db
		} else if limit > 0 {
			queryLimit = limit
		}

		db = db.Order("created_at ASC, id ASC")
		return db.Limit(int(queryLimit))
	}
}
