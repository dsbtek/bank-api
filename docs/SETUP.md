# Bank API - Setup Guide

## 📋 Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bank-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker (recommended)**
   ```bash
   docker-compose up -d mongodb redis
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

6. **Testing**
   ```bash
   # Run all tests
   npm test

   # Run tests with coverage
   npm run test:coverage

   # Run tests in watch mode
   npm run test:watch
   ```

7. **API Documentation**
   Once running, access Swagger documentation at:
   👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## 🧠 Key Implementation Areas
- Authentication (JWT + Refresh tokens)
- Role-based authorization (Admin/Customer)
- Secure fund transfers and history tracking
- Caching and rate limiting (Redis)
- Helmet, XSS, and Mongo sanitization
- Docker-based deployment
