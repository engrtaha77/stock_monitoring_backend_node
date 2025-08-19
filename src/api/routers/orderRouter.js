// routes/orderRoutes.js

import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,      // ← add this
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/",            createOrder);
router.get("/",             getMyOrders);
router.get("/all",          getAllOrders);      // ← new “admin” route
router.get("/:id",          getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment",updatePaymentStatus);
router.delete("/:id",       deleteOrder);

export default router;
