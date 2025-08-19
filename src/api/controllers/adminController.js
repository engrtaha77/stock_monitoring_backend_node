import ShopModel from '../models/shop_model.js';
import ShopkeeperModel from '../models/shopkeeper_model.js';
import mongoose from 'mongoose';
import SalespersonModel from '../models/salesperson_model.js';


export const assignShop = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { shopId, shopkeeperId } = req.body;
    const adminId = req.user.id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(shopId) || 
        !mongoose.Types.ObjectId.isValid(shopkeeperId)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    // 1. Verify shop exists and belongs to admin
    const shop = await ShopModel.findOne({
      _id: shopId,
      createdBy: adminId
    }).session(session);

    if (!shop) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Shop not found or unauthorized" });
    }

    if (shop.assignedShopkeeper) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Shop already assigned" });
    }

    // 2. Verify shopkeeper exists
    const shopkeeper = await ShopkeeperModel.findById(shopkeeperId).session(session);
    if (!shopkeeper) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Shopkeeper not found" });
    }

    if (shopkeeper.assignedShop) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Shopkeeper already assigned to a shop" });
    }

    // 3. Perform assignment
    shop.assignedShopkeeper = shopkeeperId;
    shopkeeper.assignedShop = shopId;
    
    await Promise.all([
      shop.save({ session }),
      shopkeeper.save({ session })
    ]);

    await session.commitTransaction();
    
    res.status(200).json({
      message: "Shop assigned successfully",
      shop: {
        _id: shop._id,
        name: shop.name,
        assignedShopkeeper: shop.assignedShopkeeper
      },
      shopkeeper: {
        _id: shopkeeper._id,
        name: shopkeeper.name,
        assignedShop: shopkeeper.assignedShop
      }
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      message: "Assignment failed",
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};




export const assignSalespersonToShop = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shopId, salespersonId } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(salespersonId)) {
      return res.status(400).json({ message: "Invalid shop or salesperson ID" });
    }

    // Find shop
    const shop = await ShopModel.findById(shopId).session(session);
    if (!shop) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Shop not found" });
    }

    // Find salesperson
    const salesperson = await SalespersonModel.findById(salespersonId).session(session);
    if (!salesperson) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Salesperson not found" });
    }

const salespersonObjectId = new mongoose.Types.ObjectId(salespersonId);

// Assign shopId to salesperson
salesperson.shopId = shopId;
await salesperson.save({ session });

// Update shop's salespersonIds array
if (!shop.salespersonIds.some(id => id.equals(salespersonObjectId))) {
  shop.salespersonIds.push(salespersonObjectId);
  await shop.save({ session });
}

    await session.commitTransaction();

    res.status(200).json({
      message: "Salesperson successfully assigned to shop",
      salesperson
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Failed to assign salesperson", error: error.message });
  } finally {
    session.endSession();
  }
};


