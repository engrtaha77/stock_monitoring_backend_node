// controllers/orderController.js

import OrderModel from "../models/order_model.js";
import mongoose from "mongoose";
import ShopModel from "../models/shop_model.js";

// 1. Create a new order
export const createOrder = async (req, res) => {
  try {
    const { shopId, products, totalAmount } = req.body;

    console.log(products,"pro")

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "Invalid shopId format" });
    }

    if (!Array.isArray(products) || products.length === 0 || totalAmount == null) {
      return res.status(400).json({
        message: "products (non-empty array) and totalAmount are required"
      });
    }

    const shopExists = await ShopModel.exists({ _id: shopId });
    if (!shopExists) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const order = await OrderModel.create({
      shopId,
      products,
      totalAmount
    });

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create order",
      error: error.message
    });
  }
};

// 2. Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("shopId", "name shopCode");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all orders", error: error.message });
  }
};

// 3. Get orders by shopId (used for shop-based views)
export const getMyOrders = async (req, res) => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      return res.status(400).json({ message: "shopId query parameter is required" });
    }

    const orders = await OrderModel.find({ shopId });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// 4. Get a single order
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving order", error: error.message });
  }
};

// 5. Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Status updated", order: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

// 6. Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!["paid", "unpaid", "partial"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid paymentStatus" });
    }

    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Payment status updated", order: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update payment status", error: error.message });
  }
};

// 7. Delete an order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OrderModel.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};
