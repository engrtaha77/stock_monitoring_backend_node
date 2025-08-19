import mongoose from "mongoose";

const shopkeeperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  assignedShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    default: null
  },

  role: {
    type: String,
    default: "shopkeeper",
    immutable: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ShopkeeperModel = mongoose.model("Shopkeeper", shopkeeperSchema);
export default ShopkeeperModel;
