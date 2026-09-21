package db

import (
    "context"
    "fmt"


    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/rs/zerolog/log"

    "cartly/backend/internal/config"
)


func Connect(cfg *config.Config) *pgxpool.Pool {
   connString := fmt.Sprintf(
       "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
   )

   pool, err := pgxpool.New(context.Background(), connString)
   if err != nil {
       log.Fatal().Err(err).Msg("Unable to create connection pool")
   }

   if err := pool.Ping(context.Background()); err != nil {
       log.Fatal().Err(err).Msg("Unable to ping database")
   }

   log.Info().Msg("Connected to database successfully")
   return pool
}