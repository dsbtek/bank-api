import { Router } from 'express';
import authRoutes from './auth';
import transferRoutes from './transfers';
import fizzbuzzRoutes from './fizzbuzz';
import accountRoutes from './accounts';
const router = Router();

router.use('/auth', authRoutes);
router.use('/transfers', transferRoutes);
router.use('/fizzbuzz', fizzbuzzRoutes);
router.use('/accounts', accountRoutes);

export default router;