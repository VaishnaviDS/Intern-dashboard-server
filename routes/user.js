import express from 'express';
import { getAggregatedDonations, getAllUsers, getPlatformStats, getUserHistory, userData } from '../controllers/user.js';
const router = express.Router();
router.post('/new',userData)
router.get('/history/:referralCode',getUserHistory)
router.get('/stats',getPlatformStats)
router.get('/all',getAllUsers)
router.get('/donations/aggregated/:range', getAggregatedDonations);
export default router;