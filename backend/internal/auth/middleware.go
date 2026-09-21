package auth

import (
    "context"
    "net/http"
    "strings"
)

type contextKey string

const UserContextKey contextKey = "user"

type UserContext struct {
    UserID string
    Role   string
}

func Middleware(secret string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            authHeader := r.Header.Get("Authorization")


            if authHeader != "" {
                tokenString := strings.TrimPrefix(authHeader, "Bearer ")

                claims, err := ParseToken(tokenString, secret)
                if err == nil {
                    userCtx := &UserContext {
                        UserID: claims.UserID,
                        Role:   claims.Role,
                    }
                    ctx := context.WithValue(r.Context(), UserContextKey, userCtx)
                    r = r.WithContext(ctx)
                 }
             }
             
             next.ServeHTTP(w, r)
        
         })
     }
}
   
func GetUserFromContext(ctx context.Context) *UserContext {
    user, ok := ctx.Value(UserContextKey).(*UserContext)
    if !ok {
        return nil
    }
     return user
}   