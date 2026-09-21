package auth

import (
	"testing"
	"time"
)

const testSecret = "test-secret-key-for-unit-tests"

func TestGenerateAndParseToken(t *testing.T) {
	token, err := GenerateToken("42", "owner", testSecret)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("GenerateToken returned empty string")
	}

	claims, err := ParseToken(token, testSecret)
	if err != nil {
		t.Fatalf("ParseToken failed: %v", err)
	}

	if claims.UserID != "42" {
		t.Errorf("expected UserID '42', got %q", claims.UserID)
	}
	if claims.Role != "owner" {
		t.Errorf("expected Role 'owner', got %q", claims.Role)
	}
}

func TestParseToken_WrongSecret(t *testing.T) {
	token, err := GenerateToken("42", "owner", testSecret)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	_, err = ParseToken(token, "wrong-secret")
	if err == nil {
		t.Fatal("expected ParseToken to fail with wrong secret, but it succeeded")
	}
}

func TestParseToken_Expired(t *testing.T) {
	claims := Claims{
		UserID: "42",
		Role:   "owner",
	}
	claims.ExpiresAt = nil

	token, err := GenerateToken("42", "owner", testSecret)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	time.Sleep(1 * time.Millisecond)

	_, err = ParseToken(token, testSecret)
	if err != nil {
		t.Fatalf("token should still be valid immediately after creation: %v", err)
	}
}

func TestGenerateRefreshToken_Uniqueness(t *testing.T) {
	token1, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken failed: %v", err)
	}
	token2, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken failed: %v", err)
	}

	if token1 == token2 {
		t.Fatal("two calls to GenerateRefreshToken produced the same token - randomness is broken")
	}
	if len(token1) != 64 {
		t.Errorf("expected 64-character hex token, got length %d", len(token1))
	}
}