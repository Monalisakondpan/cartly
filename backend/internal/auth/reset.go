package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func GenerateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func StoreResetToken(ctx context.Context, db *pgxpool.Pool, rawToken, subjectID, role string) error {
	hashed := hashToken(rawToken)
	expiresAt := time.Now().Add(1 * time.Hour)

	_, err := db.Exec(ctx,
		`INSERT INTO password_reset_tokens (token_hash, subject_id, role, expires_at)
		 VALUES ($1, $2, $3, $4)`,
		hashed, subjectID, role, expiresAt,
	)
	return err
}

func ValidateResetToken(ctx context.Context, db *pgxpool.Pool, rawToken string) (subjectID string, role string, err error) {
	hashed := hashToken(rawToken)

	var expiresAt time.Time
	var used bool

	err = db.QueryRow(ctx,
		`SELECT subject_id, role, expires_at, used FROM password_reset_tokens WHERE token_hash = $1`,
		hashed,
	).Scan(&subjectID, &role, &expiresAt, &used)
	if err != nil {
		return "", "", fmt.Errorf("invalid or expired reset link")
	}

	if used {
		return "", "", fmt.Errorf("this reset link has already been used")
	}

	if time.Now().After(expiresAt) {
		return "", "", fmt.Errorf("this reset link has expired")
	}

	return subjectID, role, nil
}

func MarkResetTokenUsed(ctx context.Context, db *pgxpool.Pool, rawToken string) error {
	hashed := hashToken(rawToken)
	_, err := db.Exec(ctx, `UPDATE password_reset_tokens SET used = true WHERE token_hash = $1`, hashed)
	return err
}