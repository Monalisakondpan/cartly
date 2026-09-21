package graph

import (
    "github.com/jackc/pgx/v5/pgxpool"
    
    "cartly/backend/internal/config"
)

type Resolver struct {
    DB     *pgxpool.Pool
    Config *config.Config
}