package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	JWTSecret     string
	GroqAPIKey    string
	SMTPEmail     string
	SMTPPassword  string
	UploadBaseURL string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, reading from OS environment instead")
	}

	uploadBaseURL := os.Getenv("UPLOAD_BASE_URL")
	if uploadBaseURL == "" {
		uploadBaseURL = "http://localhost:8080"
	}

	return &Config{
		DBHost:        os.Getenv("DB_HOST"),
		DBPort:        os.Getenv("DB_PORT"),
		DBUser:        os.Getenv("DB_USER"),
		DBPassword:    os.Getenv("DB_PASSWORD"),
		DBName:        os.Getenv("DB_NAME"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		GroqAPIKey:    os.Getenv("GROQ_API_KEY"),
		SMTPEmail:     os.Getenv("SMTP_EMAIL"),
		SMTPPassword:  os.Getenv("SMTP_PASSWORD"),
		UploadBaseURL: uploadBaseURL,
	}
}