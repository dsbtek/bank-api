# Bank API - API Documentation

## 🌐 Base URL
```
http://localhost:3000/api/v1
```

Access interactive Swagger documentation here:  
👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🔐 Authentication

### 1. Sign Up
```bash
POST /auth/signup
```
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### 2. Login
```bash
POST /auth/login
```
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### 3. Refresh Token
```bash
POST /auth/refresh
```
**Request:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

---

## 💳 Banking Endpoints

### 4. Initiate Transfer
```bash
POST /transfers
```
**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
```
**Request:**
```json
{
  "fromAccountId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "toAccountNumber": "1234567890",
  "amount": 100.50,
  "reference": "Monthly rent",
  "description": "Payment for apartment rent"
}
```

### 5. Get Transaction History
```bash
GET /transfers/accounts/:id/history?page=1&limit=10
```
**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 🔢 FizzBuzz Endpoints

### 6. Standard FizzBuzz
```bash
GET /fizzbuzz
```

### 7. Custom FizzBuzz
```bash
GET /fizzbuzz/custom?start=1&end=20&rules=[[2,"Even"],[3,"Three"]]
```

---

## ⚠️ Error Responses

Example error structure:
```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```
