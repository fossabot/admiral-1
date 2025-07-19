package application

import (
	"context"
	"database/sql"
	"encoding/base64"
	"fmt"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap/zaptest"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	applicationv1 "go.admiral.io/admiral/api/application/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
)

type dummyDBClient struct {
	sqlDB  *sql.DB
	gormDB *gorm.DB
}

func (d *dummyDBClient) DB() *sql.DB {
	return d.sqlDB
}

func (d *dummyDBClient) GormDB() *gorm.DB {
	return d.gormDB
}

func setupMockAPI(t *testing.T) (*api, sqlmock.Sqlmock, func()) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)

	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn:                 db,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	assert.NoError(t, err)

	client := &dummyDBClient{
		sqlDB:  db,
		gormDB: gormDB,
	}
	service.Registry["service.database"] = client

	logger := zaptest.NewLogger(t)
	scope := tally.NewTestScope("test", nil)
	cfg := &config.Config{}

	ep, err := New(cfg, logger, scope)
	assert.NoError(t, err)

	apiInstance := ep.(*api)
	cleanup := func() {
		_ = db.Close()
	}
	return apiInstance, mock, cleanup
}

func TestCreateApplication(t *testing.T) {
	apiInstance, mock, cleanup := setupMockAPI(t)
	defer cleanup()

	desc := "A test application"
	req := &applicationv1.CreateApplicationRequest{
		Name:        "TestApp",
		Description: &desc,
	}

	expectedSQL := `INSERT INTO "applications" ("name","description","created_at","updated_at","deleted_at") VALUES ($1,$2,$3,$4,$5) RETURNING "id"`
	mock.ExpectBegin()
	mock.ExpectQuery(regexp.QuoteMeta(expectedSQL)).
		WithArgs(req.Name, *req.Description, sqlmock.AnyArg(), sqlmock.AnyArg(), nil).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("bbbfae6b-b1f1-483c-b45f-02ef5a3ac640"))
	mock.ExpectCommit()

	resp, err := apiInstance.CreateApplication(context.Background(), req)
	if !assert.NoError(t, err) {
		return
	}
	if resp == nil {
		t.Fatal("received nil response")
	}

	assert.NotNil(t, resp.Application)
	assert.Equal(t, "TestApp", resp.Application.Name)
	// Since description is optional, ensure it is non-nil and compare its dereferenced value.
	assert.NotNil(t, resp.Application.Description)
	assert.Equal(t, "A test application", *resp.Application.Description)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestListApplications(t *testing.T) {
	apiInstance, mock, cleanup := setupMockAPI(t)
	defer cleanup()

	pageSize := int32(1)
	columns := []string{"id", "name", "description", "created_at", "updated_at"}
	id1 := uuid.New()
	id2 := uuid.New()
	createdAt := time.Now()
	updatedAt := createdAt

	rows := sqlmock.NewRows(columns).
		AddRow(id1, "App1", "Desc1", createdAt, updatedAt).
		AddRow(id2, "App2", "Desc2", createdAt, updatedAt)

	mock.ExpectQuery(regexp.QuoteMeta(
		`SELECT * FROM "applications" WHERE "applications"."deleted_at" IS NULL ORDER BY created_at ASC, id ASC LIMIT $1`,
	)).WithArgs(2).WillReturnRows(rows)

	req := &applicationv1.ListApplicationsRequest{
		PageSize: pageSize,
	}

	resp, err := apiInstance.ListApplications(context.Background(), req)
	if !assert.NoError(t, err) {
		return
	}
	if resp == nil {
		t.Fatal("received nil response")
	}

	assert.Len(t, resp.Applications, 1)

	rawToken := fmt.Sprintf("%d|%s", createdAt.Unix(), id2.String())
	assert.Equal(t, base64.RawURLEncoding.EncodeToString([]byte(rawToken)), resp.NextPageToken)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetApplication(t *testing.T) {
	apiInstance, mock, cleanup := setupMockAPI(t)
	defer cleanup()

	testID := uuid.New()
	columns := []string{"id", "name", "description", "created_at", "updated_at"}
	createdAt := time.Now()
	updatedAt := createdAt

	// Create a fake row. We assume description is stored as a string.
	row := sqlmock.NewRows(columns).AddRow(testID, "TestApp", "A test application", createdAt, updatedAt)

	// Update the expected query to include the LIMIT clause.
	mock.ExpectQuery(regexp.QuoteMeta(
		`SELECT * FROM "applications" WHERE id = $1 AND "applications"."deleted_at" IS NULL ORDER BY "applications"."id" LIMIT $2`,
	)).
		WithArgs(testID.String(), 1).
		WillReturnRows(row)

	req := &applicationv1.GetApplicationRequest{
		Id: testID.String(),
	}

	resp, err := apiInstance.GetApplication(context.Background(), req)
	if !assert.NoError(t, err) {
		return
	}
	if resp == nil {
		t.Fatal("received nil response")
	}

	assert.NotNil(t, resp.Application)
	assert.Equal(t, "TestApp", resp.Application.Name)
	assert.NotNil(t, resp.Application.Description)
	assert.Equal(t, "A test application", *resp.Application.Description)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdateApplication(t *testing.T) {
	apiInstance, mock, cleanup := setupMockAPI(t)
	defer cleanup()

	testID := uuid.New()

	columns := []string{"id", "name", "description", "created_at", "updated_at"}
	row := sqlmock.NewRows(columns).
		AddRow(testID, "OldName", "OldDesc", time.Now(), time.Now())
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "applications" WHERE id = $1 AND "applications"."deleted_at" IS NULL ORDER BY "applications"."id" LIMIT $2`)).
		WithArgs(testID.String(), 1).
		WillReturnRows(row)

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(
		`UPDATE "applications" SET "name"=$1,"description"=$2,"created_at"=$3,"updated_at"=$4,"deleted_at"=$5 WHERE "applications"."deleted_at" IS NULL AND "id" = $6`,
	)).
		WithArgs("NewName", "NewDesc", sqlmock.AnyArg(), sqlmock.AnyArg(), nil, testID.String()).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	desc := "NewDesc"
	req := &applicationv1.UpdateApplicationRequest{
		Application: &applicationv1.Application{
			Id:          testID.String(),
			Name:        "NewName",
			Description: &desc,
		},
	}
	resp, err := apiInstance.UpdateApplication(context.Background(), req)
	if !assert.NoError(t, err) {
		return
	}
	if resp == nil {
		t.Fatal("received nil response")
	}

	assert.NotNil(t, resp.Application)
	assert.Equal(t, "NewName", resp.Application.Name)
	assert.NotNil(t, resp.Application.Description)
	assert.Equal(t, "NewDesc", *resp.Application.Description)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestDeleteApplication(t *testing.T) {
	apiInstance, mock, cleanup := setupMockAPI(t)
	defer cleanup()

	testID := uuid.New()

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "applications" SET "deleted_at"=$1 WHERE id = $2 AND "applications"."deleted_at" IS NULL`)).
		WithArgs(sqlmock.AnyArg(), testID.String()).
		WillReturnResult(sqlmock.NewResult(0, 1)) // 1 row affected.
	mock.ExpectCommit()

	req := &applicationv1.DeleteApplicationRequest{
		Id: testID.String(),
	}
	resp, err := apiInstance.DeleteApplication(context.Background(), req)
	if !assert.NoError(t, err) {
		return
	}
	if resp == nil {
		t.Fatal("received nil response")
	}

	assert.NotNil(t, resp)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestDeleteApplication_NotFound(t *testing.T) {
	apiInstance, mock, cleanup := setupMockAPI(t)
	defer cleanup()

	testID := uuid.New()

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "applications" SET "deleted_at"=$1 WHERE id = $2 AND "applications"."deleted_at" IS NULL`)).
		WithArgs(sqlmock.AnyArg(), testID.String()).
		WillReturnResult(sqlmock.NewResult(0, 0)) // 0 rows affected to simulate not found.
	mock.ExpectCommit()

	req := &applicationv1.DeleteApplicationRequest{
		Id: testID.String(),
	}
	resp, err := apiInstance.DeleteApplication(context.Background(), req)
	assert.Error(t, err)

	var st codes.Code
	if s, ok := status.FromError(err); ok {
		st = s.Code()
	}

	assert.Equal(t, codes.NotFound, st)
	assert.Nil(t, resp)
	assert.NoError(t, mock.ExpectationsWereMet())
}
