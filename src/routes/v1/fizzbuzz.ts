import { Router } from 'express';
import { FizzBuzzController } from '../../controllers/FizzBuzzController';
import { generalRateLimit } from '../../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/v1/fizzbuzz:
 *   get:
 *     summary: Get FizzBuzz sequence from 1 to 100
 *     tags: [FizzBuzz]
 *     responses:
 *       200:
 *         description: FizzBuzz sequence generated successfully
 */
router.get('/', generalRateLimit, FizzBuzzController.getFizzBuzz);

/**
 * @swagger
 * /api/v1/fizzbuzz/custom:
 *   get:
 *     summary: Get custom FizzBuzz sequence
 *     tags: [FizzBuzz]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: end
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: rules
 *         schema:
 *           type: string
 *           description: JSON array of [number, string] pairs
 *     responses:
 *       200:
 *         description: Custom FizzBuzz sequence generated successfully
 */
router.get('/custom', generalRateLimit, FizzBuzzController.getCustomFizzBuzz);

export default router;