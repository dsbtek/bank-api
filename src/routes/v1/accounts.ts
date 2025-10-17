import { Router } from 'express';
import { AccountController } from '../../controllers/AccountController';
import { validate, accountSchemas } from '../../middleware/validation';
import { authenticate, requireCustomer } from '../../middleware/auth';
import { generalRateLimit } from '../../middleware/rateLimit';

const router = Router();

// All routes require authentication and customer role
router.use(authenticate, requireCustomer);

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         accountNumber:
 *           type: string
 *         type:
 *           type: string
 *           enum: [savings, current, salary]
 *         balance:
 *           type: number
 *         currency:
 *           type: string
 *         isActive:
 *           type: boolean
 *         dailyTransferLimit:
 *           type: number
 *         usedDailyTransferAmount:
 *           type: number
 *         lastTransferReset:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [savings, current, salary]
 *                 default: savings
 *               currency:
 *                 type: string
 *                 default: USD
 *               initialBalance:
 *                 type: number
 *                 default: 0
 *                 minimum: 0
 *               accountNumber:
 *                 type: string
 *                 default: 500
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post('/', generalRateLimit, validate({ body: accountSchemas.createAccount }), AccountController.createAccount);

/**
 * @swagger
 * /api/v1/accounts:
 *   get:
 *     summary: Get all user accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 */
router.get('/', generalRateLimit, AccountController.getUserAccounts);

/**
 * @swagger
 * /api/v1/accounts/{accountId}:
 *   get:
 *     summary: Get specific account details
 *     tags: [Accounts]
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
 *         description: Account details retrieved successfully
 */
router.get('/:accountId', generalRateLimit, validate({ params: accountSchemas.getBalance }), AccountController.getAccount);

/**
 * @swagger
 * /api/v1/accounts/{accountId}/summary:
 *   get:
 *     summary: Get account summary with transfer availability
 *     tags: [Accounts]
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
 *         description: Account summary retrieved successfully
 */
router.get('/:accountId/summary', generalRateLimit, validate({ params: accountSchemas.getBalance }), AccountController.getAccountSummary);

/**
 * @swagger
 * /api/v1/accounts/{accountId}:
 *   patch:
 *     summary: Update account details
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [savings, current, salary]
 *               dailyTransferLimit:
 *                 type: number
 *                 minimum: 0
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Account updated successfully
 */
router.patch('/:accountId', generalRateLimit, validate({ params: accountSchemas.getBalance }), AccountController.updateAccount);

/**
 * @swagger
 * /api/v1/accounts/{accountId}/deactivate:
 *   post:
 *     summary: Deactivate an account
 *     tags: [Accounts]
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
 *         description: Account deactivated successfully
 */
router.post('/:accountId/deactivate', generalRateLimit, validate({ params: accountSchemas.getBalance }), AccountController.deactivateAccount);

/**
 * @swagger
 * /api/v1/accounts/{accountId}/check-transfer:
 *   post:
 *     summary: Check if account can perform a transfer
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Transfer eligibility checked successfully
 */
router.post('/:accountId/check-transfer', generalRateLimit, validate({ params: accountSchemas.getBalance }), AccountController.checkTransferEligibility);

export default router;