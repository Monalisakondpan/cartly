package graph

import (
	"context"
	"os"
	"testing"

	"cartly/backend/graph/model"
	"cartly/backend/internal/auth"
	"cartly/backend/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

func setupTestResolver(t *testing.T) *Resolver {
	t.Helper()
	cfg := config.Load()
	dsn := "host=" + cfg.DBHost + " port=" + cfg.DBPort + " user=" + cfg.DBUser +
		" password=" + cfg.DBPassword + " dbname=" + cfg.DBName + " sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}
	return &Resolver{DB: pool, Config: cfg}
}

func contextAsOwner(userID string) context.Context {
	return context.WithValue(context.Background(), auth.UserContextKey, &auth.UserContext{
		UserID: userID,
		Role:   "owner",
	})
}

func contextAsCustomer(userID string) context.Context {
	return context.WithValue(context.Background(), auth.UserContextKey, &auth.UserContext{
		UserID: userID,
		Role:   "customer",
	})
}

func TestCreateProduct_RejectsProductInOtherOwnersStore(t *testing.T) {
	r := setupTestResolver(t)
	ctx := context.Background()

	var ownerAID, ownerBID, storeBID string
	err := r.DB.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role, first_name, last_name)
		 VALUES ('test_owner_a@example.com', 'x', 'owner', 'A', 'Test') RETURNING id`,
	).Scan(&ownerAID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, ownerAID)

	err = r.DB.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role, first_name, last_name)
		 VALUES ('test_owner_b@example.com', 'x', 'owner', 'B', 'Test') RETURNING id`,
	).Scan(&ownerBID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, ownerBID)

	err = r.DB.QueryRow(ctx,
		`INSERT INTO stores (user_id, name, slug) VALUES ($1, 'Store B', 'store-b-test') RETURNING id`,
		ownerBID,
	).Scan(&storeBID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM stores WHERE id = $1`, storeBID)

	mr := &mutationResolver{r}
	testCtx := contextAsOwner(ownerAID)
	_, err = mr.CreateProduct(testCtx, model.NewProduct{
		StoreID: storeBID,
		Name:    "Sneaky Product",
		Slug:    "sneaky-product",
		Price:   9.99,
	})

	if err == nil {
		t.Fatal("expected error when creating a product in another owner's store, got nil")
	}
	if err.Error() != "unauthorized: you do not own this store" {
		t.Errorf("expected ownership error, got: %v", err)
	}
}

func TestCreateOrder_RejectsInsufficientStock(t *testing.T) {
	r := setupTestResolver(t)
	ctx := context.Background()

	var ownerID, storeID, customerID, productID string
	err := r.DB.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role, first_name, last_name)
		 VALUES ('test_stock_owner@example.com', 'x', 'owner', 'Stock', 'Owner') RETURNING id`,
	).Scan(&ownerID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, ownerID)

	err = r.DB.QueryRow(ctx,
		`INSERT INTO stores (user_id, name, slug) VALUES ($1, 'Stock Store', 'stock-store-test') RETURNING id`,
		ownerID,
	).Scan(&storeID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM stores WHERE id = $1`, storeID)

	err = r.DB.QueryRow(ctx,
		`INSERT INTO products (store_id, name, slug, price, stock_quantity)
		 VALUES ($1, 'Limited Item', 'limited-item-test', 10.00, 3) RETURNING id`,
		storeID,
	).Scan(&productID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM products WHERE id = $1`, productID)

	err = r.DB.QueryRow(ctx,
		`INSERT INTO customers (email, password_hash, full_name)
		 VALUES ('test_stock_customer@example.com', 'x', 'Stock Customer') RETURNING id`,
	).Scan(&customerID)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM customers WHERE id = $1`, customerID)

	mr := &mutationResolver{r}
	testCtx := contextAsCustomer(customerID)

	_, err = mr.CreateOrder(testCtx, model.NewOrder{
		StoreID: storeID,
		Items: []*model.OrderItemInput{
			{ProductID: productID, Quantity: 10},
		},
	})
	if err == nil {
		t.Fatal("expected insufficient stock error, got nil")
	}

	var stockAfter int32
	r.DB.QueryRow(ctx, `SELECT stock_quantity FROM products WHERE id = $1`, productID).Scan(&stockAfter)
	if stockAfter != 3 {
		t.Errorf("stock should remain unchanged after rejected order, got %d, want 3", stockAfter)
	}
}

func TestCreateOrder_DecrementsStockOnSuccess(t *testing.T) {
	if os.Getenv("SKIP_DB_TESTS") == "true" {
		t.Skip("skipping DB test")
	}
	r := setupTestResolver(t)
	ctx := context.Background()

	var ownerID, storeID, customerID, productID string
	r.DB.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role, first_name, last_name)
		 VALUES ('test_decrement_owner@example.com', 'x', 'owner', 'Dec', 'Owner') RETURNING id`,
	).Scan(&ownerID)
	defer r.DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, ownerID)

	r.DB.QueryRow(ctx,
		`INSERT INTO stores (user_id, name, slug) VALUES ($1, 'Dec Store', 'dec-store-test') RETURNING id`,
		ownerID,
	).Scan(&storeID)
	defer r.DB.Exec(ctx, `DELETE FROM stores WHERE id = $1`, storeID)

	r.DB.QueryRow(ctx,
		`INSERT INTO products (store_id, name, slug, price, stock_quantity)
		 VALUES ($1, 'Dec Item', 'dec-item-test', 5.00, 10) RETURNING id`,
		storeID,
	).Scan(&productID)
	defer r.DB.Exec(ctx, `DELETE FROM products WHERE id = $1`, productID)

	r.DB.QueryRow(ctx,
		`INSERT INTO customers (email, password_hash, full_name)
		 VALUES ('test_decrement_customer@example.com', 'x', 'Dec Customer') RETURNING id`,
	).Scan(&customerID)
	defer r.DB.Exec(ctx, `DELETE FROM customers WHERE id = $1`, customerID)

	mr := &mutationResolver{r}
	testCtx := contextAsCustomer(customerID)

	order, err := mr.CreateOrder(testCtx, model.NewOrder{
		StoreID: storeID,
		Items: []*model.OrderItemInput{
			{ProductID: productID, Quantity: 4},
		},
	})
	if err != nil {
		t.Fatalf("expected order to succeed, got error: %v", err)
	}
	defer r.DB.Exec(ctx, `DELETE FROM order_items WHERE order_id = $1`, order.ID)
	defer r.DB.Exec(ctx, `DELETE FROM orders WHERE id = $1`, order.ID)

	var stockAfter int32
	r.DB.QueryRow(ctx, `SELECT stock_quantity FROM products WHERE id = $1`, productID).Scan(&stockAfter)
	if stockAfter != 6 {
		t.Errorf("stock after order = %d, want 6", stockAfter)
	}
}