// controllers/invoiceController.js

import mongoose from "mongoose";
import InvoiceModel  from "../models/InvoiceModel.js";
import CustomerModel from "../models/customer_model.js";
import OrderModel    from "../models/order_model.js";
import ShopModel     from "../models/shop_model.js";
import ProductModel from "../models/product_model.js";
import ShopkeeperModel from "../models/shopkeeper_model.js"; 
// Create a new invoice  fro admin and shopkeeper by cheking the role 
export const createInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

   const { id, role } = req.user;
  //  console.log(userId,"usrsss");
   console.log();
   console.log(id,"iddsss"); /// here id is shopkeeper id coming after that not 

    let {
      shopId,
      customerId,
      orderId,
      items,
      tax = 0,
      discount = 0,
      paidAmount,
      paymentMethod = "cash",
      status
    } = req.body;

 

 console.log("get lkost",id);
    // Authorization check
    if (!["shopkeeper", "admin"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
   

    // Determine shop context
    if (role === "shopkeeper") {  
   
      // console.log(shopkeeperId,"shopkeeperId");
    } else if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid shopId");
    }

    // Validate shop
    const shop = await ShopModel.findById(shopId).session(session);
    if (!shop) throw new Error("Shop not found");

    // Validate customer if provided
    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        throw new Error("Invalid customerId");
      }
      const customer = await CustomerModel.findById(customerId).session(session);
      if (!customer || customer.shopId.toString() !== shopId) {
        throw new Error("Customer not found in this shop");
      }
    }

    // Admin: fetch items from order if provided
    if (role === "admin" && orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid orderId");
      }
      const order = await OrderModel.findById(orderId).session(session);
      if (!order || order.shopId.toString() !== shopId) {
        throw new Error("Order not found in this shop");
      }

      items = order.products.map(p => ({
        _id: p._id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        barCode:p.barCode,
        lineTotal: p.quantity * p.price
      }));
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Invoice items are required");
    }

    console.log("All items are valid");

    // Validate and compute lineTotals and subTotal
    let subTotal = 0;

    for (let line of items) {
      const productId = line._id;

      console.log("Here is the product id", productId);


      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID in items");
      }

      if (typeof line.quantity !== "number" || line.quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (typeof line.price !== "number" || line.price < 0) {
        throw new Error("Invalid price");
      }

      const product = await ProductModel.findById(productId).session(session);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.quantity < line.quantity) {
        throw new Error(`Insufficient quantity for product: ${product.name}`);
      }

      line.lineTotal = line.quantity * line.price;
      subTotal += line.lineTotal;

    }


    console.log(
    "calculating grand total"
    )

    // Calculate totals
    const grandTotal = subTotal + tax - discount;
    if (typeof paidAmount !== "number" || paidAmount < 0) {
      throw new Error("Invalid paidAmount");
    }

    const balanceDue = grandTotal - paidAmount;

    console.log("Balance due is calculated", balanceDue);

    // Build invoice
    const invoiceDoc = {
      shopId,
      ...(customerId && { customerId }),
      ...(orderId && { orderId }),
      issuedBy: id,
      issuedByModel: role === "shopkeeper" ? "Shopkeeper" : "Admin",
      items,
      subTotal,
      tax,
      discount,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentMethod,
      status
    };

    console.log("Invoice document is built", invoiceDoc);

    const invoice = await InvoiceModel.create([invoiceDoc], { session });

    console.log("Invoice is built");

    // Update inventory
    for (const line of items) {
      await ProductModel.findByIdAndUpdate(
        line._id,
        { $inc: { quantity: -line.quantity } },
        { session }
      );
    }

    // Link invoice
    if (customerId) {
      await CustomerModel.findByIdAndUpdate(
        customerId,
        { $push: { invoices: invoice._id } },
        { session }
      );
    }

    if (orderId) {
      await OrderModel.findByIdAndUpdate(
        orderId,
        { $push: { invoices: invoice._id } },
        { session }
      );
    }

    await ShopModel.findByIdAndUpdate(
      shopId,
      { $push: { invoices: invoice._id } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ message: "Invoice created", invoice });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
};


/**
 * Update invoice status with proper validation
 * Allowed status transitions:
 * - pending → partially_paid → paid
 * - pending → paid
 * - pending → cancelled
 * - partially_paid → paid
 * - partially_paid → cancelled
 */
export const updateInvoiceStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id: userId, role } = req.user;
    const { invoiceId } = req.params;
    const { status } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new Error("Invalid invoice ID");
    }

    if (!["pending", "partially_paid", "paid", "cancelled"].includes(status)) {
      throw new Error("Invalid status value");
    }

    // Authorization check
    if (!["shopkeeper", "admin"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get existing invoice
    const invoice = await InvoiceModel.findById(invoiceId).session(session);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check permissions
    if (role === "shopkeeper") {
      const shopkeeper = await ShopkeeperModel.findById(userId).session(session);
      if (!shopkeeper || shopkeeper.shopId.toString() !== invoice.shopId.toString()) {
        throw new Error("Unauthorized to update this invoice");
      }
    }

    // Validate status transition
    const allowedTransitions = {
      pending: ["partially_paid", "paid", "cancelled"],
      partially_paid: ["paid", "cancelled"],
      paid: [], // Once paid, status shouldn't change
      cancelled: [] // Once cancelled, status shouldn't change
    };

    if (!allowedTransitions[invoice.status]?.includes(status)) {
      throw new Error(`Invalid status transition from ${invoice.status} to ${status}`);
    }

    // Special validation for paid status
    if (status === "paid" && invoice.balanceDue > 0) {
      throw new Error("Cannot mark as paid when balance due is greater than 0");
    }

    // Special validation for cancelled status
    if (status === "cancelled") {
      // Return inventory items if cancelling
      for (const line of invoice.items) {
        await ProductModel.findByIdAndUpdate(
          line._id,
          { $inc: { quantity: line.quantity } },
          { session }
        );
      }
    }

    // Update invoice
    invoice.status = status;
    invoice.updatedAt = new Date();

    // If marking as paid, update paid amount
    if (status === "paid") {
      invoice.paidAmount = invoice.grandTotal;
      invoice.balanceDue = 0;
    }

    await invoice.save({ session });

    await session.commitTransaction();
    
    res.status(200).json({ 
      message: "Invoice status updated successfully",
      invoice: {
        _id: invoice._id,
        status: invoice.status,
        balanceDue: invoice.balanceDue
      }
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
};


export const editInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, role } = req.user;
    const { invoiceId } = req.params;
    console.log(invoiceId)
    const {
      items,
      tax,
      discount,
      paidAmount,
      paymentMethod,
      customerId,
      orderId,
      status
    } = req.body;

    // Authorization check
    if (!["shopkeeper", "admin"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new Error("Invalid invoice ID");
    }

    // Get existing invoice
    const existingInvoice = await InvoiceModel.findById(invoiceId).session(session);
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }

    // Authorization - only shopkeeper of the shop or admin can edit
    if (role === "shopkeeper") {
      const shopkeeper = await ShopkeeperModel.findById(id).session(session);
      if (!shopkeeper || shopkeeper.shopId.toString() !== existingInvoice.shopId.toString()) {
        throw new Error("Unauthorized to edit this invoice");
      }
    }

    // Validate shop
    const shop = await ShopModel.findById(existingInvoice.shopId).session(session);
    if (!shop) throw new Error("Shop not found");

    // Validate customer if provided
    if (customerId && customerId !== existingInvoice.customerId?.toString()) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        throw new Error("Invalid customerId");
      }
      const customer = await CustomerModel.findById(customerId).session(session);
      if (!customer || customer.shopId.toString() !== existingInvoice.shopId.toString()) {
        throw new Error("Customer not found in this shop");
      }
    }

    // If items are being updated
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Invoice items are required");
      }

      // Calculate new totals and validate items
      let subTotal = 0;
      const productUpdates = [];

      for (let line of items) {
        const productId = line._id;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          throw new Error("Invalid product ID in items");
        }

        if (typeof line.quantity !== "number" || line.quantity <= 0) {
          throw new Error("Invalid quantity");
        }

        if (typeof line.price !== "number" || line.price < 0) {
          throw new Error("Invalid price");
        }

        const product = await ProductModel.findById(productId).session(session);
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        // Check if product quantity is sufficient
        // First, find the original quantity from the existing invoice
        const originalLine = existingInvoice.items.find(item => item._id.toString() === productId);
        const originalQuantity = originalLine ? originalLine.quantity : 0;
        const quantityChange = originalQuantity - line.quantity;

        if (product.quantity + quantityChange < 0) {
          throw new Error(`Insufficient quantity for product: ${product.name}`);
        }

        line.lineTotal = line.quantity * line.price;
        subTotal += line.lineTotal;

        productUpdates.push({
          productId,
          quantityChange // This will be positive (returning stock) or negative (using more stock)
        });
      }

      // Update inventory based on changes
      for (const update of productUpdates) {
        await ProductModel.findByIdAndUpdate(
          update.productId,
          { $inc: { quantity: update.quantityChange } },
          { session }
        );
      }

      // Update invoice with new items and recalculated totals
      existingInvoice.items = items;
      existingInvoice.subTotal = subTotal;
    }

    // Update other fields if provided
    if (tax !== undefined) existingInvoice.tax = tax;
    if (discount !== undefined) existingInvoice.discount = discount;
    if (paidAmount !== undefined) existingInvoice.paidAmount = paidAmount;
    if (paymentMethod) existingInvoice.paymentMethod = paymentMethod;
    if (customerId) existingInvoice.customerId = customerId;
    if (orderId) existingInvoice.orderId = orderId;
    if (status) existingInvoice.status = status;

    // Recalculate grand total and balance due
    existingInvoice.grandTotal = existingInvoice.subTotal + (existingInvoice.tax || 0) - (existingInvoice.discount || 0);
    existingInvoice.balanceDue = existingInvoice.grandTotal - existingInvoice.paidAmount;

    // Save the updated invoice
    const updatedInvoice = await existingInvoice.save({ session });

    // Update customer reference if changed
    if (customerId && customerId !== existingInvoice.customerId?.toString()) {
      // Remove from old customer if exists
      if (existingInvoice.customerId) {
        await CustomerModel.findByIdAndUpdate(
          existingInvoice.customerId,
          { $pull: { invoices: invoiceId } },
          { session }
        );
      }


      
      
      // Add to new customer
      await CustomerModel.findByIdAndUpdate(
        customerId,
        { $addToSet: { invoices: invoiceId } },
        { session }
      );
    }

    // Update order reference if changed
    if (orderId && orderId !== existingInvoice.orderId?.toString()) {
      // Remove from old order if exists
      if (existingInvoice.orderId) {
        await OrderModel.findByIdAndUpdate(
          existingInvoice.orderId,
          { $pull: { invoices: invoiceId } },
          { session }
        );
      }
      
      // Add to new order
      await OrderModel.findByIdAndUpdate(
        orderId,
        { $addToSet: { invoices: invoiceId } },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Invoice updated", invoice: updatedInvoice });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// get all invoice based on role  for shopkkepr and admins 

// import if needed
export const getInvoicesByAdminOrShopkeepers = async (req, res) => {
  try {
    const { role, id } = req.user;
    let shopId = req.query.shopId; // only used by admin
    let invoices;
    console.log(req.user,"users");

    if (role === "admin") {
      // Admin sees all invoices issued by shopkeepers (without customer data)
      invoices = await InvoiceModel.find({ issuedByModel: "Admin" })
        .populate("shopId", "name shopCode")
        .populate("issuedBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      // Remove customer data for admin view
      for (const invoice of invoices) {
        delete invoice.customerId;
      }

    } else if (role === "shopkeeper") {
      console.log("accessed");
      // Fetch shopId of the logged-in shopkeeper
      const shopkeeper = await ShopkeeperModel.findById(id).lean();
      console.log(shopkeeper,"shopkeeper mil gaya ");
      if (!shopkeeper || !shopkeeper.assignedShop) {
        return res.status(400).json({ message: "Shopkeeper or shop ID not found" });
      }

      shopId = shopkeeper.assignedShop;

      // Shopkeeper sees all invoices from their shop
      invoices = await InvoiceModel.find({
        shopId,
        issuedByModel: "Shopkeeper"
      })
        .populate("shopId", "name shopCode")
        .populate("customerId", "name phoneNumber")
        .populate("issuedBy", "name email")
        .sort({ createdAt: -1 });

    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(invoices);

  } catch (err) {
    console.error("Invoice fetch error:", err);
    res.status(500).json({ message: "Failed to fetch invoices", error: err.message });
  }
};


// Get all invoices for a given customer
export const getInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }
    const invoices = await InvoiceModel.find({ customerId })
      .populate("shopId", "name shopCode")
      .populate("issuedBy", "name email");
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invoices", error: err.message });
  }
};

// Get a single invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    const invoice = await InvoiceModel.findById(id)
      .populate("shopId", "name shopCode")
      .populate("customerId", "name phoneNumber")
      .populate("orderId",    "totalAmount status")
      .populate("issuedBy",   "name email");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving invoice", error: err.message });
  }
};

// (Optional) Delete an invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    const deleted = await InvoiceModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete invoice", error: err.message });
  }
};



export const getMyShopInvoices = async (req, res) => {
  try {
    const { role, shopId } = req.user;
    if (role !== "shopkeeper") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const invoices = await InvoiceModel.find({ shopId })
      .populate("customerId", "name phoneNumber")
      .populate("issuedBy",   "name email")
      .sort({ invoiceDate: -1 });
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch shop invoices", error: err.message });
  }
};
