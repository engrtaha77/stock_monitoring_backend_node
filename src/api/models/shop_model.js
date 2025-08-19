import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  shopCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  assignedShopkeeper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shopkeeper",
    default: null
  },
  salespersonIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salesperson"
  }],
   customers: [  // 👈 New field: Array of Customer references
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
      }
    ],
  
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  }
}, { timestamps: true });

const ShopModel = mongoose.model("Shop", shopSchema);
export default ShopModel;
