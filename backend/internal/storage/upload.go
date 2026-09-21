package storage

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const uploadDir = "./uploads"

func NewUploadHandler(baseURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "invalid file upload", http.StatusBadRequest)
			return
		}
		defer file.Close()

		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			http.Error(w, "failed to create upload directory", http.StatusInternalServerError)
			return
		}

		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		fullPath := filepath.Join(uploadDir, filename)

		dst, err := os.Create(fullPath)
		if err != nil {
			http.Error(w, "failed to save file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "failed to write file", http.StatusInternalServerError)
			return
		}

		url := fmt.Sprintf("%s/uploads/%s", baseURL, filename)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"url": "%s"}`, url)
	}
}