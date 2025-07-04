package variable

import (
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"go.admiral.io/admiral/internal/querybuilder"
)

type parsedSettingFilter struct {
	applicationID *uuid.UUID
	environmentID *uuid.UUID
	otherFilters  string
}

func (a *api) parseSettingFilter(filter string) (*parsedSettingFilter, error) {
	if filter == "" {
		return &parsedSettingFilter{}, nil
	}

	// Use QueryBuilder's parser
	query, _, err := a.parseFilterRaw(filter)
	if err != nil {
		return nil, fmt.Errorf("failed to parse filter: %v", err)
	}

	result := &parsedSettingFilter{}
	var otherFilters []string

	for _, field := range query.AndFields {
		if field.Key.Kind != "field" {
			continue
		}
		if field.Operation != "=" {
			otherFilters = append(otherFilters, fmt.Sprintf("field['%s']%s%v", field.Key.Name, field.Operation, field.Value))
			continue
		}

		value, ok := field.Value.(string)
		if !ok {
			otherFilters = append(otherFilters, fmt.Sprintf("field['%s']%s%v", field.Key.Name, field.Operation, field.Value))
			continue
		}

		switch field.Key.Name {
		case "application_id":
			uuidVal, err := uuid.Parse(value)
			if err != nil {
				return nil, fmt.Errorf("invalid application_id UUID: %v", err)
			}
			result.applicationID = &uuidVal
		case "environment_id":
			uuidVal, err := uuid.Parse(value)
			if err != nil {
				return nil, fmt.Errorf("invalid environment_id UUID: %v", err)
			}
			result.environmentID = &uuidVal
		default:
			otherFilters = append(otherFilters, fmt.Sprintf("field['%s']%s'%s'", field.Key.Name, field.Operation, value))
		}
	}

	if len(otherFilters) > 0 {
		result.otherFilters = strings.Join(otherFilters, " AND ")
	}

	return result, nil
}

func (a *api) parseFilterRaw(filter string) (*querybuilder.Query, map[string]interface{}, error) {
	if filter == "" {
		return &querybuilder.Query{}, nil, nil
	}

	res, err := querybuilder.ParseReader("", strings.NewReader(filter))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse filter: %v", err)
	}

	q, ok := res.(*querybuilder.Query)
	if !ok {
		return nil, nil, errors.New("unable to parse query into expected structure")
	}

	return q, nil, nil
}
