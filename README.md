# Bank API - Secure Banking Application

A production-ready backend banking application designed to demonstrate scalable, secure, and maintainable software architecture using a **modular monolith** pattern.

## 🚀 Quick Start

```bash
git clone <git@github.com:dsbtek/bank-api.git> # with ssh
git clone <git@github.com:dsbtek/bank-api.git> # with https
cd bank-api
npm install
npm run dev
```

## 🧩 Documentation

- [Setup Guide](./src/docs/SETUP.md) – Environment setup, dependencies, and deployment  
- [API Documentation](./src/docs/API_DOCS.md) – Endpoints, examples, and Swagger usage

## 🚀 Features

### 🔐 Security & Authentication
- **JWT + Refresh Token** authentication with Redis storage
- **Role-based access control** (Customer & Admin roles)
- **Rate limiting** with Redis-backed storage
- **Password hashing** with bcrypt and account lockout protection
- **Security middleware** (Helmet, CORS, XSS protection, Mongo sanitization)

### 💰 Banking Operations
- **Secure fund transfers** with ACID transactions
- **Account management** with daily transfer limits
- **Transaction history** with pagination
- **Balance inquiries** and account verification
- **Comprehensive validation** and error handling

### 🏗️ Architecture
- **Modular Monolith** with clear separation of concerns
- **API versioning** ready for future evolution
- **TypeScript** for type safety and better developer experience
- **Clean Architecture** principles (Controllers → Services → Models)

### 📊 Developer Experience
- **Swagger/OpenAPI** documentation
- **Comprehensive test suite** with Jest
- **Docker containerization** for easy deployment
- **Structured logging** with Winston
- **Environment-based configuration**

## 🛠️ Tech Stack

- **Runtime:** Node.js, Express.js, TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Cache & Sessions:** Redis
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker & Docker Compose

## 📁 Project Structure
    src/
        ├── controllers/ # Route handlers
        ├── services/ # Business logic
        ├── models/ # Database models
        ├── middleware/ # Custom middleware
        ├── routes/ # API routes (versioned)
        ├── utils/ # Utilities and helpers
        ├── types/ # TypeScript definitions
        └── config/ # Configuration files

## 🎯 Key Design Decisions
## Why Modular Monolith?
- **Simplicity**: Easier to develop and deploy than microservices

- **Maintainability**: Clear module boundaries within a single codebase

- **Scalability**: Prepared for future service extraction if needed

- **Performance**: No network overhead between modules

## Security First Approach
- Comprehensive input validation and sanitization

- Defense in depth with multiple security layers

- Secure defaults and principle of least privilege

- Audit trails for all financial operations

## 📈 Scalability Considerations
- Horizontal scaling with stateless application design

- Database sharding ready with MongoDB

- Redis Cluster for distributed caching

- Load balancing with multiple app instances
---
## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
© 2025 Bank API. All rights reserved.
