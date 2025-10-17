import express from 'express';
import 'express-async-errors';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import 'module-alias/register';
import config from './config/default';

import logger from './utils/logger';
import { AppError } from './utils/AppError';
import { errorHandler } from './middleware/errorHandler';
import v1Routes from './routes/v1';
import fs from "fs";
import path from "path";
import YAML from "yaml";
const app = express();
// Load YAML file
const file = fs.readFileSync(path.join(__dirname, "./docs/swagger.yaml"), "utf8");
const swaggerDocument = YAML.parse(file);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
const baseYaml = YAML.parse(fs.readFileSync("./src/docs/swagger.yaml", "utf8"));


const swaggerSpec = swaggerJsdoc({
  definition: baseYaml,
  apis: ["./src/routes/**/*.ts"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bank API is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});


// API routes
app.use('/api/v1', v1Routes);

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler
app.use(errorHandler);

// MongoDB connection
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

export default app;