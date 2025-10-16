import { Router } from 'express';
import authRoutes from './auth';
import transferRoutes from './transfers';
import fizzbuzzRoutes from './fizzbuzz';

const router = Router();

router.use('/auth', authRoutes);
router.use('/transfers', transferRoutes);
router.use('/fizzbuzz', fizzbuzzRoutes);

export default router;