package variable

import (
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"go.admiral.io/admiral/internal/model"
)

func (a *api) buildEffectiveQuery(db *gorm.DB, applicationID, environmentID *uuid.UUID, limit int32, pageToken *string) *gorm.DB {
	query := db.Model(&model.Variable{})

	if applicationID == nil && environmentID == nil {
		query = query.Where("application_id IS NULL AND environment_id IS NULL")
		query = query.Select(`
            DISTINCT ON (key)
				id,
				application_id,
				environment_id,
				key,
				value,
				description,
				is_sensitive,
				created_at,
				updated_at
        `).Order(`
            key,
            created_at ASC,
            id ASC
        `)
		query = query.Scopes(a.queryBuilder.PaginatedQuery("", limit, pageToken))
		return query
	}

	var conditions []string
	var args []interface{}

	if applicationID != nil && environmentID != nil {
		conditions = append(conditions, "(application_id = ? AND environment_id = ?)")
		args = append(args, *applicationID, *environmentID)
	}
	if applicationID != nil {
		conditions = append(conditions, "(application_id = ? AND environment_id IS NULL)")
		args = append(args, *applicationID)
	}
	conditions = append(conditions, "(application_id IS NULL AND environment_id IS NULL)")

	query = query.Where(strings.Join(conditions, " OR "), args...)
	query = query.Select(`
        DISTINCT ON (key)
			id,
			application_id,
			environment_id,
			key,
			value,
			description,
			is_sensitive,
			created_at,
			updated_at
    `).Order(`
        key,
        CASE
            WHEN environment_id IS NOT NULL THEN 3
            WHEN application_id IS NOT NULL THEN 2
            ELSE 1
        END DESC,
        created_at ASC,
        id ASC
    `)

	query = query.Scopes(a.queryBuilder.PaginatedQuery("", limit, pageToken))
	return query
}
