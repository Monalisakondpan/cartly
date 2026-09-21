package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DBTX interface {
	Exec(ctx context.Context, sql string, arguments ...interface{}) (pgconn.CommandTag, error)
	QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func StoreRefreshToken(ctx context.Context, db DBTX, rawToken, subjectID, role string) error {
	hashed := hashToken(rawToken)
	expiresAt := time.Now().Add(30 * 24 * time.Hour)

	_, err := db.Exec(ctx,
		`INSERT INTO refresh_tokens (token_hash, subject_id, role, expires_at)
		 VALUES ($1, $2, $3, $4)`,
		hashed, subjectID, role, expiresAt,
	)
	return err
}

func ValidateRefreshToken(ctx context.Context, db DBTX, rawToken string) (subjectID string, role string, err error) {
	hashed := hashToken(rawToken)

	var expiresAt time.Time
	var revoked bool

	err = db.QueryRow(ctx,
		`SELECT subject_id, role, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1`,
		hashed,
	).Scan(&subjectID, &role, &expiresAt, &revoked)
	if err != nil {
		return "", "", fmt.Errorf("invalid refresh token")
	}

	if revoked {
		return "", "", fmt.Errorf("refresh token has been revoked")
	}

	if time.Now().After(expiresAt) {
		return "", "", fmt.Errorf("refresh token has expired")
	}

	return subjectID, role, nil
}

func RevokeRefreshToken(ctx context.Context, db DBTX, rawToken string) error {
	hashed := hashToken(rawToken)
	_, err := db.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, hashed)
	return err
}