import express from 'express';
import { assignSalespersonToShop, assignShop } from '../controllers/adminController.js';


import authMiddleware, { authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Apply admin-only authorization to all routes
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// Shop Assignment Routes
router.post('/', assignShop);
router.post('/assign-salesperson', assignSalespersonToShop);

//  fro shopkeeper incouide 







export default router;