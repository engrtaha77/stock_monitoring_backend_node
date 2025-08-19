import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product_controller.js";
import authMiddleware, { authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// All routes protected by token
router.use(authMiddleware);

// Create product: for both shopkeeper and admin
router.post('/', authorizeRoles('shopkeeper', 'admin'), createProduct);

// Read products
router.get('/', authorizeRoles('shopkeeper', 'admin'), getAllProducts);
router.get('/:id', authorizeRoles('shopkeeper', 'admin'), getProductById);

// Update product
router.put('/:id', authorizeRoles('shopkeeper', 'admin'), updateProduct);

// Delete product
router.delete('/:id', authorizeRoles('admin'), deleteProduct); // Only admin can delete

export default router;
