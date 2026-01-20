# Payments Service

## 🚀 Quick Start

1.  **Spin up DB:**
    ```bash
    docker-compose up -d
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Run the app:**
    ```bash
    pnpm run start:dev
    ```

## 🧪 Run Integration Tests

```bash
pnpm run test:integration
```

## 🛠 Testing Endpoints

### 1. Initialize Payment
```bash
curl http://localhost:3000/payments/init \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_'$RANDOM'",
    "amount": 1000,
    "currency": "USD"
  }'
```

### 2. Idempotency Check (Duplicate Order ID)
*Send the same request twice.*
```bash
# First request
curl http://localhost:3000/payments/init \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "idempotent_test_123",
    "amount": 2500,
    "currency": "EUR"
  }'

# Second request (returns same token from DB)
curl http://localhost:3000/payments/init \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "idempotent_test_123",
    "amount": 2500,
    "currency": "EUR"
  }'
```

### 3. Invalid Request
```bash
curl http://localhost:3000/payments/init \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "fail_123",
    "amount": -5,
    "currency": "XX"
  }'
```

