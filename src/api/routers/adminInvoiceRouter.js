import express from "express";
import authMiddleware, { authorizeRoles } from "../middlewares/auth.js";
import {
  createInvoice,
  getInvoiceById,
  deleteInvoice,
  getInvoicesByAdminOrShopkeepers
} from "../controllers/invoiceController.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

// Admin issues an invoice (typically against a bulk Order)
router.post("/", createInvoice);
router.get("/",getInvoicesByAdminOrShopkeepers)
// router.get("/:id", getInvoiceById);
// router.delete("/:id", deleteInvoice);

export default router;
