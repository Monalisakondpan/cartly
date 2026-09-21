package auth

import "testing"

func TestHashPassword_ProducesDifferentHashesForSameInput(t *testing.T) {
	hash1, err := HashPassword("MySecurePass123!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	hash2, err := HashPassword("MySecurePass123!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if hash1 == hash2 {
		t.Fatal("hashing the same password twice produced identical hashes - bcrypt salt is not working")
	}
}

func TestCheckPassword_CorrectPassword(t *testing.T) {
	hash, err := HashPassword("MySecurePass123!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if !CheckPassword("MySecurePass123!", hash) {
		t.Fatal("CheckPassword returned false for the correct password")
	}
}

func TestCheckPassword_WrongPassword(t *testing.T) {
	hash, err := HashPassword("MySecurePass123!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if CheckPassword("WrongPassword456!", hash) {
		t.Fatal("CheckPassword returned true for an incorrect password - this is a critical security bug")
	}
}

func TestCheckPassword_EmptyPassword(t *testing.T) {
	hash, err := HashPassword("MySecurePass123!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if CheckPassword("", hash) {
		t.Fatal("CheckPassword returned true for an empty password - critical security bug")
	}
}