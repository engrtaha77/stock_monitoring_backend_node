// routes/customerRoutes.js

import express from "express";
import authMiddleware, { authorizeRoles } from "../middlewares/auth.js";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from "../controllers/customer_controller.js";

const router = express.Router();
router.use(authMiddleware);

// Shopkeepers & admins can manage customers
router.post("/",    authorizeRoles("shopkeeper"), createCustomer);
router.get("/",     authorizeRoles("shopkeeper"), getAllCustomers);
router.get("/:id",  authorizeRoles("shopkeeper"), getCustomerById);
router.put("/:id",  authorizeRoles("shopkeeper"), updateCustomer);
router.delete("/:id", authorizeRoles("shopkeeper"), deleteCustomer);

export default router;
