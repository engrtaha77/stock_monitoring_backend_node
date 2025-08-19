// routes/shopkeeperInvoiceRoutes.js

import express from "express";
import authMiddleware, { authorizeRoles } from "../middlewares/auth.js";
import {
  createInvoice,
  getMyShopInvoices,       // ← import it
  getInvoicesByCustomer,
  getInvoiceById,
  getInvoicesByAdminOrShopkeepers,
  deleteInvoice,
  editInvoice
} from "../controllers/invoiceController.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRoles("shopkeeper"));

// Shopkeeper issues a walk‑in customer invoice
router.post("/", createInvoice);
router.put("/", editInvoice);
router.get("/",getInvoicesByAdminOrShopkeepers)

// List this shop’s invoices
router.get("/my", getMyShopInvoices);

// List a specific customer’s invoices
router.get("/customer/:customerId", getInvoicesByCustomer);

// View a single invoice
router.get("/:id", getInvoiceById);
router.delete("/:id", deleteInvoice);

export default router;
