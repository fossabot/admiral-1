package querybuilder

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
	"gorm.io/gorm/utils/tests"
)

type object struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Foo       string
	Bar       string
	Meta      string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func TestUUIDAsPrimaryKey(t *testing.T) {
	qb := New([]string{"foo", "bar"})
	db, _ := gorm.Open(tests.DummyDialector{}, nil)

	// Create an object with a UUID.
	sampleUUID := uuid.New()
	obj := object{
		ID:  sampleUUID,
		Foo: "some foo",
		Bar: "some bar",
	}

	dryRunDB := db.Session(&gorm.Session{DryRun: true}).Create(&obj)
	insertSQL := dryRunDB.Statement.SQL.String()
	assert.Contains(t, insertSQL, "INSERT INTO")

	filter := "field['id'] = '" + sampleUUID.String() + "'"
	q := db.Session(&gorm.Session{DryRun: true}).
		Scopes(qb.PaginatedQuery(filter, 0, nil)).
		Find(&[]object{})
	querySQL := q.Statement.SQL.String()

	assert.Contains(t, querySQL, "id =")
	assert.NoError(t, q.Error)
}

func TestMaxQueryLimit(t *testing.T) {
	qb := New([]string{"foo", "bar"})
	db, _ := gorm.Open(tests.DummyDialector{}, nil)

	testCases := []struct {
		id          string
		input       int32
		query       string
		shouldError bool
	}{
		{
			id:          "Empty limit",
			input:       0,
			shouldError: false,
		},
		{
			id:          "Under limit",
			input:       999,
			shouldError: false,
		},
		{
			id:          "Equal to limit",
			input:       1000,
			shouldError: false,
		},
		{
			id:          "Above limit",
			input:       1001,
			shouldError: true,
		},
	}

	for _, test := range testCases {
		err := qb.PaginatedQuery("", test.input, nil)(db).Error
		if test.shouldError {
			assert.Error(t, err)
		} else {
			assert.NoError(t, err)
		}
	}
}

func TestPaginatedQueryBuilder(t *testing.T) {
	qb := New([]string{"foo", "bar"})
	db, _ := gorm.Open(tests.DummyDialector{}, nil)

	testCases := []struct {
		id          string
		input       string
		expect      string
		shouldError bool
	}{
		{
			id:          "No Input",
			input:       "",
			expect:      "SELECT * FROM `objects` WHERE `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "No Input",
			input:       "field['baz'] = value",
			expect:      "",
			shouldError: true,
		},
		{
			id:          "Search by field",
			input:       "field['foo'] = value",
			expect:      "SELECT * FROM `objects` WHERE foo ILIKE ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search by quoted field",
			input:       "field['foo'] = 'value'",
			expect:      "SELECT * FROM `objects` WHERE foo ILIKE ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search by multiple fields",
			input:       "field['foo'] = value1 field['bar'] = value2",
			expect:      "SELECT * FROM `objects` WHERE (foo ILIKE ? AND bar ILIKE ?) AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search by substring",
			input:       "field['foo'] ~= value",
			expect:      "SELECT * FROM `objects` WHERE foo ILIKE ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search for numeric values equal to a specified value in a field",
			input:       "field['foo'] = 0",
			expect:      "SELECT * FROM `objects` WHERE foo = ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search for numeric values less than to a specified value in a field",
			input:       "field['foo'] < 0",
			expect:      "SELECT * FROM `objects` WHERE foo < ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search for numeric values less than or equal to a specified value in a field",
			input:       "field['foo'] <= 0",
			expect:      "SELECT * FROM `objects` WHERE foo <= ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search for numeric values greater than to a specified value in a field",
			input:       "field['foo'] > 0",
			expect:      "SELECT * FROM `objects` WHERE foo > ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
		{
			id:          "Search for numeric values greater than or equal to a specified value in a field",
			input:       "field['foo'] >= 0",
			expect:      "SELECT * FROM `objects` WHERE foo >= ? AND `objects`.`deleted_at` IS NULL ORDER BY created_at ASC, id ASC LIMIT ?",
			shouldError: false,
		},
	}

	for _, test := range testCases {
		var objects []*object

		q := db.Session(&gorm.Session{DryRun: true}).Scopes(qb.PaginatedQuery(test.input, 0, nil)).Find(&objects)
		err := q.Error
		sql := q.Statement.SQL.String()

		if test.shouldError {
			assert.Error(t, err)
		} else {
			assert.NoError(t, err)
			assert.Equal(t, test.expect, sql)
		}
	}
}

func TestParseFilter(t *testing.T) {
	queryBuilder := New([]string{"foo", "bar"})

	testCases := []struct {
		id           string
		input        string
		expectQuery  string
		expectValues map[string]interface{}
		shouldError  bool
	}{
		{
			id:           "No Input",
			input:        "",
			expectQuery:  "",
			expectValues: nil,
			shouldError:  false,
		},
		{
			id:           "No Input",
			input:        "field['baz'] = value",
			expectQuery:  "",
			expectValues: nil,
			shouldError:  true,
		},
		{
			id:           "Search by field",
			input:        "field['foo'] = value",
			expectQuery:  "foo ILIKE @foo",
			expectValues: map[string]interface{}{"foo": "value"},
			shouldError:  false,
		},
		{
			id:           "Search by quoted field",
			input:        `field[ "foo" ] = "value"`,
			expectQuery:  "foo ILIKE @foo",
			expectValues: map[string]interface{}{"foo": "value"},
			shouldError:  false,
		},
		{
			id:           "Search by single quoted field",
			input:        "field['foo'] = 'value'",
			expectQuery:  "foo ILIKE @foo",
			expectValues: map[string]interface{}{"foo": "value"},
			shouldError:  false,
		},
		{
			id:           "Search by multiple fields",
			input:        "field['foo'] = 'value1' field['bar'] = 'value2'",
			expectQuery:  "foo ILIKE @foo AND bar ILIKE @bar",
			expectValues: map[string]interface{}{"bar": "value2", "foo": "value1"},
			shouldError:  false,
		},
		{
			id:           "Search by substring",
			input:        "field['foo'] ~= 'value'",
			expectQuery:  "foo ILIKE @foo",
			expectValues: map[string]interface{}{"foo": "%value%"},
			shouldError:  false,
		},
		{
			id:           "Search by uuid",
			input:        "field['foo'] = '258e4d48-0369-4287-a375-4a496718d174'",
			expectQuery:  "foo = @foo",
			expectValues: map[string]interface{}{"foo": "258e4d48-0369-4287-a375-4a496718d174"},
			shouldError:  false,
		},
		{
			id:           "Search for numeric values equal to a specified value in a field",
			input:        "field['foo'] = 0",
			expectQuery:  "foo = @foo",
			expectValues: map[string]interface{}{"foo": float64(0)},
			shouldError:  false,
		},
		{
			id:           "Search for numeric values less than to a specified value in a field",
			input:        "field['foo'] < 0",
			expectQuery:  "foo < @foo",
			expectValues: map[string]interface{}{"foo": float64(0)},
			shouldError:  false,
		},
		{
			id:           "Search for numeric values less than or equal to a specified value in a field",
			input:        "field['foo'] <= 0",
			expectQuery:  "foo <= @foo",
			expectValues: map[string]interface{}{"foo": float64(0)},
			shouldError:  false,
		},
		{
			id:           "Search for numeric values greater than to a specified value in a field",
			input:        "field['foo'] > 0",
			expectQuery:  "foo > @foo",
			expectValues: map[string]interface{}{"foo": float64(0)},
			shouldError:  false,
		},
		{
			id:           "Search for numeric values greater than or equal to a specified value in a field",
			input:        "field['foo'] >= 0",
			expectQuery:  "foo >= @foo",
			expectValues: map[string]interface{}{"foo": float64(0)},
			shouldError:  false,
		},
	}

	for _, test := range testCases {
		q, v, err := queryBuilder.ParseFilter(test.input)

		if test.shouldError {
			assert.Error(t, err)
		} else {
			assert.NoError(t, err)
			assert.Equal(t, test.expectQuery, q)
			assert.Equal(t, test.expectValues, v)
		}
	}
}
