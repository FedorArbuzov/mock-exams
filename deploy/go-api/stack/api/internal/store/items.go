package store

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Item struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	OwnerID     *int64    `json:"owner_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type ItemStore struct {
	pool *pgxpool.Pool
}

func NewItemStore(pool *pgxpool.Pool) *ItemStore {
	return &ItemStore{pool: pool}
}

func (s *ItemStore) List(ctx context.Context) ([]Item, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, title, description, owner_id, created_at
		FROM items
		ORDER BY id ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list items: %w", err)
	}
	defer rows.Close()

	var items []Item
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.ID, &it.Title, &it.Description, &it.OwnerID, &it.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan item: %w", err)
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}
	if items == nil {
		items = []Item{}
	}
	return items, nil
}
