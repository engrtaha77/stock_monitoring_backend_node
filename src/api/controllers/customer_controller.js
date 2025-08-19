import mongoose from "mongoose";
import CustomerModel from "../models/customer_model.js";

import ShopModel from "../models/shop_model.js";

// Create a new customer (only by shopkeeper)
export const createCustomer = async (req, res) => {
  try {
    const { role, id: shopkeeperId } = req.user;
    const {shopId} = req.query
    const {  name, phoneNumber } = req.body;

    if (role !== "shopkeeper") {
      return res.status(403).json({ message: "Only shopkeepers can create customers" });
    }
    if (!name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const customer = await CustomerModel.create({
      name,
      phoneNumber,
      shopId,
      shopkeeperId
    });

    // Optionally, add to shopkeeper's customers array
    await ShopModel.findByIdAndUpdate(shopId, {
      $push: { customers: customer._id }
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: "Failed to create customer", error: err.message });
  }
};

// Get all customers for this shopkeeper’s shop
export const getAllCustomers = async (req, res) => {
  try {
    const { role } = req.user;
    const {shopId} = req.query


    if (role !== "shopkeeper") {
      return res.status(403).json({ message: "Only shopkeepers can view customers" });
    }

    const customers = await CustomerModel.find({ shopId });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers", error: err.message });
  }
};


// Get a single customer by ID (must belong to shop)
export const getCustomerById = async (req, res) => {
  try {
    const { role, id: shopkeeperId } = req.user;
    const { id: customerId } = req.params;   // <-- get customer ID from params

    if (role !== "shopkeeper") {
      return res.status(403).json({ message: "Only shopkeepers can view customers" });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await CustomerModel.findOne({
      _id: customerId,
      shopkeeperId: shopkeeperId,  // make sure customer belongs to this shopkeeper
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found or does not belong to you" });
    }

    return res.status(200).json(customer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error retrieving customer", error: err.message });
  }
};


// Update a customer
export const updateCustomer = async (req, res) => {
  try {
    const { role, id: shopkeeperId } = req.user;      // logged in shopkeeper ID
    const { id: customerId } = req.params;            // customer ID from URL
    const { name, phoneNumber } = req.body;

    if (role !== "shopkeeper") {
      return res.status(403).json({ message: "Only shopkeepers can update customers" });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // find customer that belongs to this shopkeeper
    const customer = await CustomerModel.findOne({
      _id: customerId,
      shopkeeperId: shopkeeperId
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found or does not belong to you" });
    }

    // update fields
    if (name) customer.name = name;
    if (phoneNumber) customer.phoneNumber = phoneNumber;

    await customer.save();
    res.status(200).json({ message: "Customer updated successfully", customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update customer", error: err.message });
  }
};


// Delete a customer
export const deleteCustomer = async (req, res) => {
  try {
    const { role, id: shopkeeperId } = req.user;
    const { id: customerId } = req.params;     // <– get from params

    if (role !== "shopkeeper") {
      return res.status(403).json({ message: "Only shopkeepers can delete customers" });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await CustomerModel.findOneAndDelete({
      _id: customerId,
      shopkeeperId: shopkeeperId,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found or does not belong to you" });
    }

    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete customer", error: err.message });
  }
};


