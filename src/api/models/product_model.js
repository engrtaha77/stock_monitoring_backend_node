import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barCode: { type: String, required: true },
  description: String,
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  um: { type: String, enum: ["kg", "g", "l", "ml", "pcs"], default: "pcs" },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Shopkeeper']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: function () {
      return this.createdByModel === 'Shopkeeper';
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Admin barcode must be globally unique among admins
productSchema.index(
  { barCode: 1 },
  {
    unique: true,
    partialFilterExpression: { createdByModel: 'Admin' }
  }
);

// ✅ Shopkeeper barcode must be unique per shop
productSchema.index(
  { barCode: 1, shopId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      createdByModel: 'Shopkeeper',
      shopId: { $exists: true }
    }
  }
);

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;
