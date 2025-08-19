import express from 'express';
import {
  createShop,
  updateShop,
  getAllShops,
  getShopById,
  deactivateShop
} from '../controllers/shop_controller.js';

import authMiddleware, { authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// 🔐 Apply auth & admin-only access
router.use(authMiddleware);

router.post('/', authorizeRoles('admin'), createShop);
router.delete('/:id', authorizeRoles('admin'), deactivateShop);
router.put('/:id', authorizeRoles('admin'), updateShop);
router.get('/', authorizeRoles('admin'), getAllShops);
router.get('/:id', authorizeRoles('admin'), getShopById);

export default router;
