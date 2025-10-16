import { Router } from 'express';
import { TransferController } from '../../controllers/TransferController';
import { validate, transferSchemas } from '../../middleware/validation';
import { authenticate, requireCustomer } from '../../middleware/auth';
import { transferRateLimit } from '../../middleware/rateLimit';
import Joi from 'joi';

const router = Router();

// All routes require authentication and customer role
router.use(authenticate, requireCustomer);

/**
 * @swagger
 * /api/v1/transfers:
 *   post:
 *     summary: Initiate a transfer between accounts
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountNumber
 *               - amount
 *               - reference
 *             properties:
 *               fromAccountId:
 *                 type: string
 *               toAccountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer completed successfully
 */
router.post('/', transferRateLimit, validate({ body: transferSchemas.initiateTransfer }), TransferController.initiateTransfer);

/**
 * @swagger
 * /api/v1/transfers/accounts/{accountId}/history:
 *   get:
 *     summary: Get transaction history for an account
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 */
router.get('/accounts/:accountId/history', validate({ 
  params: transferSchemas.transactionHistory,
  query: Joi.object({
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(10)
  })
}), TransferController.getTransactionHistory);

/**
 * @swagger
 * /api/v1/transfers/accounts/{accountId}/balance:
 *   get:
 *     summary: Get account balance
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 */
router.get('/accounts/:accountId/balance', validate({ 
  params: transferSchemas.getBalance 
}), TransferController.getAccountBalance);

export default router;