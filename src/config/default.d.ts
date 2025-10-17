declare const _default: {
  port: string | number;
  env: string;

  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };

  redis: {
    host: string;
    port: number;
    password?: string;
  };

  jwt: {
    secret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };

  rateLimit: {
    windowMs: number;
    max: number;
    transferWindowMs: number;
    transferMax: number;
  };

  security: {
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockoutTime: number;
  };

  swagger: {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bank API",
      version: "1.0.0",
      description: "A production-grade backend banking system with modular monolith architecture.",
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local development server",
      },
    ],
    
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in the format: Bearer <token>",
        },
      },
    },
    
  },
  apis: ["./src/routes/v1/**/*.ts", "../src/docs/swagger.yaml"],
}
};

export default _default;
