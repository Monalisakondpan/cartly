package main

import (
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/rs/cors"
	"github.com/vektah/gqlparser/v2/ast"

	"cartly/backend/graph"
	"cartly/backend/internal/auth"
	"cartly/backend/internal/config"
	"cartly/backend/internal/db"
	"cartly/backend/internal/logger"
	"cartly/backend/internal/ratelimit"
	"cartly/backend/internal/storage"

	zlog "github.com/rs/zerolog/log"
)

const defaultPort = "8080"

func main() {
	logger.Init()
	zlog.Info().Msg("Cartly backend alive")

	cfg := config.Load()
	pool := db.Connect(cfg)
	defer pool.Close()

	resolver := &graph.Resolver{DB: pool, Config: cfg}
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	corsHandler := cors.New(cors.Options{
		AllowOriginFunc: func(origin string) bool {
			if origin == "" {
				return true
			}
			return origin == "http://localhost:5173"
		},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	limiter := ratelimit.New(100, 20)

	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	http.Handle("/query", corsHandler.Handler(limiter.Middleware(auth.Middleware(cfg.JWTSecret)(srv))))
	http.HandleFunc("/upload", corsHandler.Handler(storage.NewUploadHandler(cfg.UploadBaseURL)).ServeHTTP)
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	zlog.Info().Msgf("Connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}