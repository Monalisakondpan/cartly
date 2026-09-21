package graph

import (
	"cartly/backend/graph/model"
	"cartly/backend/internal/ai"
	"cartly/backend/internal/auth"
	"cartly/backend/internal/email"
	"cartly/backend/internal/shipping"
	"context"
	"fmt"
)

func (r *mutationResolver) CreateProduct(ctx context.Context, input model.NewProduct) (*model.Product, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	var storeOwner string
	err := r.DB.QueryRow(ctx, `SELECT user_id FROM stores WHERE id = $1`, input.StoreID).Scan(&storeOwner)
	if err != nil || storeOwner != user.UserID {
		return nil, fmt.Errorf("unauthorized: you do not own this store")
	}

	if len(input.Name) > 255 {
		return nil, fmt.Errorf("product name must be 255 characters or fewer")
	}
	if input.Description != nil && len(*input.Description) > 1000 {
		return nil, fmt.Errorf("description must be 1000 characters or fewer")
	}
	if len(input.Slug) > 255 {
		return nil, fmt.Errorf("slug must be 255 characters or fewer")
	}

	var product model.Product
	err = r.DB.QueryRow(ctx,
		`INSERT INTO products (store_id, category_id, name, slug, description, price, stock_quantity, image_url, weight_grams)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, store_id, category_id, name, slug, description, price, stock_quantity, image_url, weight_grams`,
		input.StoreID, input.CategoryID, input.Name, input.Slug, input.Description, input.Price, input.StockQuantity, input.ImageURL, input.WeightGrams).Scan(
		&product.ID, &product.StoreID, &product.CategoryID, &product.Name, &product.Slug, &product.Description, &product.Price, &product.StockQuantity, &product.ImageURL, &product.WeightGrams,
	)
	if err != nil {
		return nil, err
	}
	suggested := shipping.SuggestPackage(product.WeightGrams)
	product.SuggestedPackage = &suggested
	return &product, nil
}

func (r *mutationResolver) Register(ctx context.Context, input model.RegisterInput) (*model.AuthUser, error) {
	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}
	var user model.AuthUser
	err = r.DB.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role, first_name, last_name, mobile_number, country, address)
		 VALUES ($1, $2, 'owner', $3, $4, $5, $6, $7)
		 RETURNING id, email, role, first_name, last_name, mobile_number, country, address`,
		input.Email, hashedPassword, input.FirstName, input.LastName, input.MobileNumber, input.Country, input.Address,
	).Scan(&user.ID, &user.Email, &user.Role, &user.FirstName, &user.LastName, &user.MobileNumber, &user.Country, &user.Address)
	if err != nil {
		return nil, err
	}

	go func() {
		subject, body := email.WelcomeEmail(input.FirstName)
		if err := email.Send(r.Config.SMTPEmail, r.Config.SMTPPassword, user.Email, subject, body); err != nil {
			fmt.Println("failed to send welcome email:", err)
		}
	}()

	return &user, nil
}

func (r *mutationResolver) Login(ctx context.Context, input model.LoginInput) (*model.AuthPayload, error) {
	var user model.AuthUser
	var passwordHash string
	err := r.DB.QueryRow(ctx,
		`SELECT id, email, role, password_hash FROM users WHERE email = $1`,
		input.Email,
	).Scan(&user.ID, &user.Email, &user.Role, &passwordHash)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}
	if !auth.CheckPassword(input.Password, passwordHash) {
		return nil, fmt.Errorf("invalid email or password")
	}
	token, err := auth.GenerateToken(user.ID, user.Role, r.Config.JWTSecret)
	if err != nil {
		return nil, err
	}
	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}
	if err := auth.StoreRefreshToken(ctx, r.DB, refreshToken, user.ID, user.Role); err != nil {
		return nil, err
	}
	return &model.AuthPayload{
		Token:        token,
		RefreshToken: refreshToken,
		User:         &user,
	}, nil
}

func (r *mutationResolver) CreateStore(ctx context.Context, input model.NewStore) (*model.Store, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}
	if len(input.Name) > 255 {
		return nil, fmt.Errorf("store name must be 255 characters or fewer")
	}
	if input.Description != nil && len(*input.Description) > 1000 {
		return nil, fmt.Errorf("description must be 1000 characters or fewer")
	}
	if len(input.Slug) > 255 {
		return nil, fmt.Errorf("slug must be 255 characters or fewer")
	}

	var store model.Store
	err := r.DB.QueryRow(ctx,
		`INSERT INTO stores (user_id, name, slug, description)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, name, slug, description`,
		user.UserID, input.Name, input.Slug, input.Description,
	).Scan(&store.ID, &store.UserID, &store.Name, &store.Slug, &store.Description)
	if err != nil {
		return nil, err
	}
	return &store, nil
}

func (r *mutationResolver) UpdateStore(ctx context.Context, input model.UpdateStoreInput) (*model.Store, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}
	if input.Name != nil && len(*input.Name) > 255 {
		return nil, fmt.Errorf("store name must be 255 characters or fewer")
	}
	if input.Description != nil && len(*input.Description) > 1000 {
		return nil, fmt.Errorf("description must be 1000 characters or fewer")
	}
	if input.Slug != nil && len(*input.Slug) > 255 {
		return nil, fmt.Errorf("slug must be 255 characters or fewer")
	}

	var store model.Store
	err := r.DB.QueryRow(ctx,
		`UPDATE stores
		 SET name = COALESCE($1, name),
		     slug = COALESCE($2, slug),
		     description = COALESCE($3, description)
		 WHERE user_id = $4
		 RETURNING id, user_id, name, slug, description`,
		input.Name, input.Slug, input.Description, user.UserID,
	).Scan(&store.ID, &store.UserID, &store.Name, &store.Slug, &store.Description)
	if err != nil {
		return nil, fmt.Errorf("store not found or update failed")
	}
	return &store, nil
}

func (r *mutationResolver) UpdateProduct(ctx context.Context, id string, input model.UpdateProductInput) (*model.Product, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}
	if input.Name != nil && len(*input.Name) > 255 {
		return nil, fmt.Errorf("product name must be 255 characters or fewer")
	}
	if input.Description != nil && len(*input.Description) > 1000 {
		return nil, fmt.Errorf("description must be 1000 characters or fewer")
	}
	if input.Slug != nil && len(*input.Slug) > 255 {
		return nil, fmt.Errorf("slug must be 255 characters or fewer")
	}

	var product model.Product
	err := r.DB.QueryRow(ctx,
		`UPDATE products p
		 SET name = COALESCE($1, p.name),
		     category_id = COALESCE($2, p.category_id),
		     slug = COALESCE($3, p.slug),
		     description = COALESCE($4, p.description),
		     price = COALESCE($5, p.price),
		     stock_quantity = COALESCE($6, p.stock_quantity),
		     image_url = COALESCE($7, p.image_url),
		     weight_grams = COALESCE($8, p.weight_grams)
		 FROM stores s
		 WHERE p.store_id = s.id
		   AND p.id = $9
		   AND s.user_id = $10
		 RETURNING p.id, p.store_id, p.category_id, p.name, p.slug, p.description, p.price, p.stock_quantity, p.image_url, p.weight_grams`,
		input.Name, input.CategoryID, input.Slug, input.Description, input.Price, input.StockQuantity, input.ImageURL, input.WeightGrams, id, user.UserID,
	).Scan(&product.ID, &product.StoreID, &product.CategoryID, &product.Name, &product.Slug, &product.Description, &product.Price, &product.StockQuantity, &product.ImageURL, &product.WeightGrams)
	if err != nil {
		return nil, fmt.Errorf("product not found or unauthorized")
	}
	suggested := shipping.SuggestPackage(product.WeightGrams)
	product.SuggestedPackage = &suggested
	return &product, nil
}

func (r *mutationResolver) DeleteProduct(ctx context.Context, id string) (bool, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return false, fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	result, err := r.DB.Exec(ctx,
		`DELETE FROM products
		 USING stores
		 WHERE products.store_id = stores.id
		   AND products.id = $1
		   AND stores.user_id = $2`,
		id, user.UserID,
	)
	if err != nil {
		return false, err
	}

	if result.RowsAffected() == 0 {
		return false, fmt.Errorf("product not found or unauthorized")
	}

	return true, nil
}

func (r *mutationResolver) CreateCategory(ctx context.Context, input model.NewCategory) (*model.Category, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	var storeOwner string
	err := r.DB.QueryRow(ctx, `SELECT user_id FROM stores WHERE id = $1`, input.StoreID).Scan(&storeOwner)
	if err != nil || storeOwner != user.UserID {
		return nil, fmt.Errorf("unauthorized: you do not own this store")
	}

	var category model.Category
	err = r.DB.QueryRow(ctx,
		`INSERT INTO categories (store_id, name, slug)
		 VALUES ($1, $2, $3)
		 RETURNING id, store_id, name, slug`,
		input.StoreID, input.Name, input.Slug,
	).Scan(&category.ID, &category.StoreID, &category.Name, &category.Slug)
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *mutationResolver) RegisterCustomer(ctx context.Context, input model.RegisterCustomerInput) (*model.CustomerAuthPayload, error) {
	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var customer model.Customer
	err = tx.QueryRow(ctx,
		`INSERT INTO customers (email, password_hash, full_name)
		 VALUES ($1, $2, $3)
		 RETURNING id, email, full_name`,
		input.Email, hashedPassword, input.FullName,
	).Scan(&customer.ID, &customer.Email, &customer.FullName)
	if err != nil {
		return nil, err
	}

	token, err := auth.GenerateToken(customer.ID, "customer", r.Config.JWTSecret)
	if err != nil {
		return nil, err
	}
	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}
	if err := auth.StoreRefreshToken(ctx, tx, refreshToken, customer.ID, "customer"); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	go func() {
		subject, body := email.WelcomeEmail(input.FullName)
		if err := email.Send(r.Config.SMTPEmail, r.Config.SMTPPassword, customer.Email, subject, body); err != nil {
			fmt.Println("failed to send welcome email:", err)
		}
	}()

	return &model.CustomerAuthPayload{
		Token:        token,
		RefreshToken: refreshToken,
		Customer:     &customer,
	}, nil
}

func (r *mutationResolver) LoginCustomer(ctx context.Context, input model.LoginCustomerInput) (*model.CustomerAuthPayload, error) {
	var customer model.Customer
	var passwordHash string
	err := r.DB.QueryRow(ctx,
		`SELECT id, email, full_name, password_hash FROM customers WHERE email = $1`,
		input.Email,
	).Scan(&customer.ID, &customer.Email, &customer.FullName, &passwordHash)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}
	if !auth.CheckPassword(input.Password, passwordHash) {
		return nil, fmt.Errorf("invalid email or password")
	}
	token, err := auth.GenerateToken(customer.ID, "customer", r.Config.JWTSecret)
	if err != nil {
		return nil, err
	}
	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}
	if err := auth.StoreRefreshToken(ctx, r.DB, refreshToken, customer.ID, "customer"); err != nil {
		return nil, err
	}
	return &model.CustomerAuthPayload{
		Token:        token,
		RefreshToken: refreshToken,
		Customer:     &customer,
	}, nil
}

func (r *mutationResolver) CreateOrder(ctx context.Context, input model.NewOrder) (*model.Order, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "customer" {
		return nil, fmt.Errorf("unauthorized: must be logged in as a customer")
	}

	if input.IdempotencyKey != nil && *input.IdempotencyKey != "" {
		var existing model.Order
		err := r.DB.QueryRow(ctx,
			`SELECT id, store_id, customer_id, status, total FROM orders WHERE idempotency_key = $1`,
			*input.IdempotencyKey,
		).Scan(&existing.ID, &existing.StoreID, &existing.CustomerID, &existing.Status, &existing.Total)
		if err == nil {
			itemRows, err := r.DB.Query(ctx,
				`SELECT id, product_id, quantity, price_at_purchase FROM order_items WHERE order_id = $1`,
				existing.ID,
			)
			if err == nil {
				defer itemRows.Close()
				for itemRows.Next() {
					var oi model.OrderItem
					itemRows.Scan(&oi.ID, &oi.ProductID, &oi.Quantity, &oi.PriceAtPurchase)
					existing.Items = append(existing.Items, &oi)
				}
			}
			return &existing, nil
		}
	}

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var total float64
	type lineItem struct {
		productID string
		quantity  int32
		price     float64
	}
	var lineItems []lineItem

	for _, item := range input.Items {
		var price float64
		var stock int32
		err := tx.QueryRow(ctx,
			`SELECT price, stock_quantity FROM products WHERE id = $1 AND store_id = $2`,
			item.ProductID, input.StoreID,
		).Scan(&price, &stock)
		if err != nil {
			return nil, fmt.Errorf("product not found: %s", item.ProductID)
		}
		if item.Quantity > stock {
			return nil, fmt.Errorf("insufficient stock for product %s: requested %d, available %d", item.ProductID, item.Quantity, stock)
		}

		_, err = tx.Exec(ctx,
			`UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
			item.Quantity, item.ProductID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to update stock for product %s: %w", item.ProductID, err)
		}

		lineItems = append(lineItems, lineItem{
			productID: item.ProductID,
			quantity:  item.Quantity,
			price:     price,
		})
		total += price * float64(item.Quantity)
	}

	var order model.Order
	err = tx.QueryRow(ctx,
		`INSERT INTO orders (store_id, customer_id, status, total, idempotency_key)
		 VALUES ($1, $2, 'pending', $3, $4)
		 RETURNING id, store_id, customer_id, status, total`,
		input.StoreID, user.UserID, total, input.IdempotencyKey,
	).Scan(&order.ID, &order.StoreID, &order.CustomerID, &order.Status, &order.Total)
	if err != nil {
		return nil, err
	}

	for _, li := range lineItems {
		var oi model.OrderItem
		err := tx.QueryRow(ctx,
			`INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, product_id, quantity, price_at_purchase`,
			order.ID, li.productID, li.quantity, li.price,
		).Scan(&oi.ID, &oi.ProductID, &oi.Quantity, &oi.PriceAtPurchase)
		if err != nil {
			return nil, err
		}
		order.Items = append(order.Items, &oi)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	var customerEmail, customerName string
	if emailErr := r.DB.QueryRow(ctx, `SELECT email, full_name FROM customers WHERE id = $1`, user.UserID).Scan(&customerEmail, &customerName); emailErr == nil {
		go func() {
			subject, body := email.OrderConfirmationEmail(customerName, order.ID, order.Total)
			if err := email.Send(r.Config.SMTPEmail, r.Config.SMTPPassword, customerEmail, subject, body); err != nil {
				fmt.Println("failed to send order confirmation email:", err)
			}
		}()
	}

	return &order, nil
}

func (r *mutationResolver) UpdateOrderStatus(ctx context.Context, orderID string, input model.UpdateOrderStatusInput) (*model.Order, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	var order model.Order
	err := r.DB.QueryRow(ctx,
		`UPDATE orders o
		 SET status = $1
		 FROM stores s
		 WHERE o.store_id = s.id
		   AND o.id = $2
		   AND s.user_id = $3
		 RETURNING o.id, o.store_id, o.customer_id, o.status, o.total`,
		input.Status, orderID, user.UserID,
	).Scan(&order.ID, &order.StoreID, &order.CustomerID, &order.Status, &order.Total)
	if err != nil {
		return nil, fmt.Errorf("order not found or unauthorized")
	}

	return &order, nil
}

func (r *mutationResolver) GenerateProductDescription(ctx context.Context, name string, keywords *string) (string, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return "", fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	keywordStr := ""
	if keywords != nil {
		keywordStr = *keywords
	}

	description, err := ai.GenerateProductDescription(r.Config.GroqAPIKey, name, keywordStr)
	if err != nil {
		return "", err
	}

	return description, nil
}

func (r *mutationResolver) DeleteStore(ctx context.Context) (bool, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return false, fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	var storeID string
	err = tx.QueryRow(ctx, `SELECT id FROM stores WHERE user_id = $1`, user.UserID).Scan(&storeID)
	if err != nil {
		return false, fmt.Errorf("store not found")
	}

	_, err = tx.Exec(ctx,
		`DELETE FROM order_items
		 USING orders
		 WHERE order_items.order_id = orders.id
		   AND orders.store_id = $1`,
		storeID,
	)
	if err != nil {
		return false, err
	}

	_, err = tx.Exec(ctx, `DELETE FROM orders WHERE store_id = $1`, storeID)
	if err != nil {
		return false, err
	}

	_, err = tx.Exec(ctx, `DELETE FROM products WHERE store_id = $1`, storeID)
	if err != nil {
		return false, err
	}

	_, err = tx.Exec(ctx, `DELETE FROM categories WHERE store_id = $1`, storeID)
	if err != nil {
		return false, err
	}

	_, err = tx.Exec(ctx, `DELETE FROM stores WHERE id = $1`, storeID)
	if err != nil {
		return false, err
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}

	return true, nil
}

func (r *mutationResolver) LoginAdmin(ctx context.Context, input model.LoginAdminInput) (*model.AdminAuthPayload, error) {
	var admin model.Admin
	var passwordHash string
	err := r.DB.QueryRow(ctx,
		`SELECT id, email, password_hash FROM admins WHERE email = $1`,
		input.Email,
	).Scan(&admin.ID, &admin.Email, &passwordHash)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}
	if !auth.CheckPassword(input.Password, passwordHash) {
		return nil, fmt.Errorf("invalid email or password")
	}
	token, err := auth.GenerateToken(admin.ID, "admin", r.Config.JWTSecret)
	if err != nil {
		return nil, err
	}
	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}
	if err := auth.StoreRefreshToken(ctx, r.DB, refreshToken, admin.ID, "admin"); err != nil {
		return nil, err
	}
	return &model.AdminAuthPayload{
		Token:        token,
		RefreshToken: refreshToken,
		Admin:        &admin,
	}, nil
}

func (r *mutationResolver) AdminDeleteStore(ctx context.Context, storeID string) (bool, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "admin" {
		return false, fmt.Errorf("unauthorized: admin access required")
	}

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	var ownerID string
	err = tx.QueryRow(ctx, `SELECT user_id FROM stores WHERE id = $1`, storeID).Scan(&ownerID)
	if err != nil {
		return false, fmt.Errorf("store not found")
	}

	_, err = tx.Exec(ctx,
		`DELETE FROM order_items USING orders WHERE order_items.order_id = orders.id AND orders.store_id = $1`,
		storeID,
	)
	if err != nil {
		return false, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM orders WHERE store_id = $1`, storeID)
	if err != nil {
		return false, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM products WHERE store_id = $1`, storeID)
	if err != nil {
		return false, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM categories WHERE store_id = $1`, storeID)
	if err != nil {
		return false, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM stores WHERE id = $1`, storeID)
	if err != nil {
		return false, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, ownerID)
	if err != nil {
		return false, err
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) RefreshToken(ctx context.Context, refreshToken string) (*model.RefreshPayload, error) {
	subjectID, role, err := auth.ValidateRefreshToken(ctx, r.DB, refreshToken)
	if err != nil {
		return nil, err
	}

	newToken, err := auth.GenerateToken(subjectID, role, r.Config.JWTSecret)
	if err != nil {
		return nil, err
	}

	return &model.RefreshPayload{
		Token: newToken,
	}, nil
}

func (r *mutationResolver) RequestPasswordReset(ctx context.Context, emailAddress string, role string) (bool, error) {
	var subjectID string
	var tableName string

	switch role {
	case "owner":
		tableName = "users"
	case "customer":
		tableName = "customers"
	case "admin":
		tableName = "admins"
	default:
		return false, fmt.Errorf("invalid role")
	}

	query := fmt.Sprintf(`SELECT id FROM %s WHERE email = $1`, tableName)
	err := r.DB.QueryRow(ctx, query, emailAddress).Scan(&subjectID)
	if err != nil {
		return true, nil
	}

	resetToken, err := auth.GenerateResetToken()
	if err != nil {
		return false, err
	}
	if err := auth.StoreResetToken(ctx, r.DB, resetToken, subjectID, role); err != nil {
		return false, err
	}

	resetLink := fmt.Sprintf("http://localhost:5173/reset-password?token=%s&role=%s", resetToken, role)
	go func() {
		subject, body := email.PasswordResetEmail(resetLink)
		if err := email.Send(r.Config.SMTPEmail, r.Config.SMTPPassword, emailAddress, subject, body); err != nil {
			fmt.Println("failed to send reset email:", err)
		}
	}()

	return true, nil
}

func (r *mutationResolver) ResetPassword(ctx context.Context, token string, newPassword string) (bool, error) {
	subjectID, role, err := auth.ValidateResetToken(ctx, r.DB, token)
	if err != nil {
		return false, err
	}

	hashedPassword, err := auth.HashPassword(newPassword)
	if err != nil {
		return false, err
	}

	var tableName string
	switch role {
	case "owner":
		tableName = "users"
	case "customer":
		tableName = "customers"
	case "admin":
		tableName = "admins"
	default:
		return false, fmt.Errorf("invalid role")
	}

	query := fmt.Sprintf(`UPDATE %s SET password_hash = $1 WHERE id = $2`, tableName)
	_, err = r.DB.Exec(ctx, query, hashedPassword, subjectID)
	if err != nil {
		return false, err
	}

	if err := auth.MarkResetTokenUsed(ctx, r.DB, token); err != nil {
		return false, err
	}

	return true, nil
}

func (r *queryResolver) Products(ctx context.Context, storeID string, search *string, categoryID *string, limit *int32, offset *int32) ([]*model.Product, error) {
	query := `SELECT id, store_id, category_id, name, slug, description, price, stock_quantity, image_url, weight_grams
	          FROM products WHERE store_id = $1`
	args := []interface{}{storeID}
	argPos := 2

	if search != nil && *search != "" {
		query += fmt.Sprintf(" AND name ILIKE $%d", argPos)
		args = append(args, "%"+*search+"%")
		argPos++
	}

	if categoryID != nil {
		query += fmt.Sprintf(" AND category_id = $%d", argPos)
		args = append(args, *categoryID)
		argPos++
	}

	query += " ORDER BY id"

	if limit != nil {
		query += fmt.Sprintf(" LIMIT $%d", argPos)
		args = append(args, *limit)
		argPos++
	}

	if offset != nil {
		query += fmt.Sprintf(" OFFSET $%d", argPos)
		args = append(args, *offset)
		argPos++
	}

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*model.Product
	for rows.Next() {
		var p model.Product
		if err := rows.Scan(
			&p.ID, &p.StoreID, &p.CategoryID, &p.Name, &p.Slug,
			&p.Description, &p.Price, &p.StockQuantity, &p.ImageURL, &p.WeightGrams,
		); err != nil {
			return nil, err
		}
		suggested := shipping.SuggestPackage(p.WeightGrams)
		p.SuggestedPackage = &suggested
		products = append(products, &p)
	}
	return products, nil
}

func (r *queryResolver) MyStore(ctx context.Context) (*model.Store, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil {
		return nil, fmt.Errorf("unauthorized: must be logged in")
	}

	var store model.Store
	err := r.DB.QueryRow(ctx,
		`SELECT id, user_id, name, slug, description FROM stores WHERE user_id = $1`,
		user.UserID,
	).Scan(&store.ID, &store.UserID, &store.Name, &store.Slug, &store.Description)
	if err != nil {
		return nil, nil
	}
	return &store, nil
}

func (r *queryResolver) Categories(ctx context.Context, storeID string) ([]*model.Category, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, store_id, name, slug FROM categories WHERE store_id = $1`,
		storeID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*model.Category
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.ID, &c.StoreID, &c.Name, &c.Slug); err != nil {
			return nil, err
		}
		categories = append(categories, &c)
	}
	return categories, nil
}

func (r *queryResolver) StoreBySlug(ctx context.Context, slug string) (*model.Store, error) {
	var store model.Store
	err := r.DB.QueryRow(ctx,
		`SELECT id, user_id, name, slug, description FROM stores WHERE slug = $1`,
		slug,
	).Scan(&store.ID, &store.UserID, &store.Name, &store.Slug, &store.Description)
	if err != nil {
		return nil, nil
	}
	return &store, nil
}

func (r *queryResolver) ProductBySlug(ctx context.Context, storeID string, slug string) (*model.Product, error) {
	var p model.Product
	err := r.DB.QueryRow(ctx,
		`SELECT id, store_id, category_id, name, slug, description, price, stock_quantity, image_url, weight_grams
		 FROM products WHERE store_id = $1 AND slug = $2`,
		storeID, slug,
	).Scan(&p.ID, &p.StoreID, &p.CategoryID, &p.Name, &p.Slug, &p.Description, &p.Price, &p.StockQuantity, &p.ImageURL, &p.WeightGrams)
	if err != nil {
		return nil, nil
	}
	suggested := shipping.SuggestPackage(p.WeightGrams)
	p.SuggestedPackage = &suggested
	return &p, nil
}

func (r *queryResolver) MyOrders(ctx context.Context) ([]*model.Order, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "owner" {
		return nil, fmt.Errorf("unauthorized: must be logged in as an owner")
	}

	rows, err := r.DB.Query(ctx,
		`SELECT o.id, o.store_id, o.customer_id, o.status, o.total
		 FROM orders o
		 JOIN stores s ON o.store_id = s.id
		 WHERE s.user_id = $1
		 ORDER BY o.id DESC`,
		user.UserID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []*model.Order
	for rows.Next() {
		var o model.Order
		if err := rows.Scan(&o.ID, &o.StoreID, &o.CustomerID, &o.Status, &o.Total); err != nil {
			return nil, err
		}
		orders = append(orders, &o)
	}

	for _, o := range orders {
		itemRows, err := r.DB.Query(ctx,
			`SELECT id, product_id, quantity, price_at_purchase FROM order_items WHERE order_id = $1`,
			o.ID,
		)
		if err != nil {
			return nil, err
		}
		for itemRows.Next() {
			var oi model.OrderItem
			if err := itemRows.Scan(&oi.ID, &oi.ProductID, &oi.Quantity, &oi.PriceAtPurchase); err != nil {
				itemRows.Close()
				return nil, err
			}
			o.Items = append(o.Items, &oi)
		}
		itemRows.Close()
	}

	return orders, nil
}

func (r *queryResolver) AllStores(ctx context.Context) ([]*model.StoreWithOwner, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "admin" {
		return nil, fmt.Errorf("unauthorized: admin access required")
	}

	rows, err := r.DB.Query(ctx,
		`SELECT s.id, s.name, s.slug, u.email,
		        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''),
		        (SELECT COUNT(*) FROM products WHERE store_id = s.id),
		        (SELECT COUNT(*) FROM orders WHERE store_id = s.id)
		 FROM stores s
		 JOIN users u ON s.user_id = u.id
		 ORDER BY s.id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stores []*model.StoreWithOwner
	for rows.Next() {
		var s model.StoreWithOwner
		if err := rows.Scan(&s.ID, &s.Name, &s.Slug, &s.OwnerEmail, &s.OwnerName, &s.ProductCount, &s.OrderCount); err != nil {
			return nil, err
		}
		stores = append(stores, &s)
	}
	return stores, nil
}

func (r *queryResolver) PlatformStats(ctx context.Context) (*model.PlatformStats, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "admin" {
		return nil, fmt.Errorf("unauthorized: admin access required")
	}

	var stats model.PlatformStats
	err := r.DB.QueryRow(ctx, `SELECT COUNT(*) FROM stores`).Scan(&stats.TotalStores)
	if err != nil {
		return nil, err
	}
	err = r.DB.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'owner'`).Scan(&stats.TotalOwners)
	if err != nil {
		return nil, err
	}
	err = r.DB.QueryRow(ctx, `SELECT COUNT(*) FROM customers`).Scan(&stats.TotalCustomers)
	if err != nil {
		return nil, err
	}
	err = r.DB.QueryRow(ctx, `SELECT COUNT(*) FROM orders`).Scan(&stats.TotalOrders)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *queryResolver) Stores(ctx context.Context) ([]*model.Store, error) {
	rows, err := r.DB.Query(ctx,
		`SELECT id, user_id, name, slug, description FROM stores ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stores []*model.Store
	for rows.Next() {
		var s model.Store
		if err := rows.Scan(&s.ID, &s.UserID, &s.Name, &s.Slug, &s.Description); err != nil {
			return nil, err
		}
		stores = append(stores, &s)
	}
	return stores, nil
}

func (r *queryResolver) Me(ctx context.Context) (*model.CurrentUser, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil {
		return nil, nil
	}

	var currentUser model.CurrentUser
	currentUser.ID = user.UserID
	currentUser.Role = user.Role

	var tableName string
	var nameColumn string
	switch user.Role {
	case "owner":
		tableName = "users"
		nameColumn = "NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')"
	case "customer":
		tableName = "customers"
		nameColumn = "full_name"
	case "admin":
		tableName = "admins"
		nameColumn = "NULL"
	default:
		return nil, fmt.Errorf("unknown role")
	}

	query := fmt.Sprintf(`SELECT email, %s FROM %s WHERE id = $1`, nameColumn, tableName)
	err := r.DB.QueryRow(ctx, query, user.UserID).Scan(&currentUser.Email, &currentUser.Name)
	if err != nil {
		return nil, err
	}

	return &currentUser, nil
}

func (r *queryResolver) AllOwners(ctx context.Context) ([]*model.OwnerWithStats, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "admin" {
		return nil, fmt.Errorf("unauthorized: admin access required")
	}

	rows, err := r.DB.Query(ctx,
		`SELECT id, email, first_name, last_name, country FROM users WHERE role = 'owner' ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var owners []*model.OwnerWithStats
	for rows.Next() {
		var o model.OwnerWithStats
		if err := rows.Scan(&o.ID, &o.Email, &o.FirstName, &o.LastName, &o.Country); err != nil {
			return nil, err
		}
		owners = append(owners, &o)
	}
	return owners, nil
}

func (r *queryResolver) AllCustomers(ctx context.Context) ([]*model.CustomerWithStats, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "admin" {
		return nil, fmt.Errorf("unauthorized: admin access required")
	}

	rows, err := r.DB.Query(ctx,
		`SELECT id, email, full_name FROM customers ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []*model.CustomerWithStats
	for rows.Next() {
		var c model.CustomerWithStats
		if err := rows.Scan(&c.ID, &c.Email, &c.FullName); err != nil {
			return nil, err
		}
		customers = append(customers, &c)
	}
	return customers, nil
}

func (r *queryResolver) AllOrders(ctx context.Context) ([]*model.OrderWithDetails, error) {
	user := auth.GetUserFromContext(ctx)
	if user == nil || user.Role != "admin" {
		return nil, fmt.Errorf("unauthorized: admin access required")
	}

	rows, err := r.DB.Query(ctx,
		`SELECT o.id, o.store_id, s.name, o.customer_id, c.email, o.status, o.total
		 FROM orders o
		 JOIN stores s ON o.store_id = s.id
		 JOIN customers c ON o.customer_id = c.id
		 ORDER BY o.id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []*model.OrderWithDetails
	for rows.Next() {
		var o model.OrderWithDetails
		if err := rows.Scan(&o.ID, &o.StoreID, &o.StoreName, &o.CustomerID, &o.CustomerEmail, &o.Status, &o.Total); err != nil {
			return nil, err
		}
		orders = append(orders, &o)
	}
	return orders, nil
}

func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }
func (r *Resolver) Query() QueryResolver       { return &queryResolver{r} }

type (
	mutationResolver struct{ *Resolver }
	queryResolver    struct{ *Resolver }
)