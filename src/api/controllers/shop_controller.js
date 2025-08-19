import ShopModel from '../models/shop_model.js';
import mongoose from 'mongoose';

// Create new shop (Admin only)
export const createShop = async (req, res) => {
  try {
    const { name, address, shopCode } = req.body;
    const createdBy = req.user.id; // Admin ID from JWT

    // Validate required fields
    if (!name || !address || !shopCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newShop = await ShopModel.create({
  name,
  address,
  shopCode: shopCode.toUpperCase(),
  createdBy,
  isActive: true
});

    res.status(201).json(newShop);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Shop code must be unique" });
    }
    res.status(500).json({ message: "Failed to create shop", error: error.message });
  }
};

// Get all shops (Admin only)
export const getAllShops = async (req, res) => {
  try {
    const shops = await ShopModel.find();
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch shops", error: error.message });
  }
};

// Get single shop by ID (Admin only)
export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shop ID" });
    }

    const shop = await ShopModel.findById(id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch shop", error: error.message });
  }
};

// Update shop (Admin only)
export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, shopCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shop ID" });
    }

    const updatedShop = await ShopModel.findByIdAndUpdate(
      id,
      { name, address, shopCode },
      { new: true, runValidators: true }
    );

    if (!updatedShop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json(updatedShop);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Shop code must be unique" });
    }
    res.status(500).json({ message: "Failed to update shop", error: error.message });
  }
};

// Deactivate shop (Admin only)
export const deactivateShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await ShopModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json({ 
      message: "Shop deactivated successfully",
      shop 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate shop", error: error.message });
  }
};