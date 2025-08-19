// models/invoice_model.js
import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:      String,
  quantity:  { type: Number, required: true },
  price:     { type: Number, required: true },
  lineTotal: { type: Number, required: true },
    barCode: 
        { type: String, unique: true,required: true },
      
  
});

const invoiceSchema = new mongoose.Schema({
  shopId:        { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  orderId:       { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  issuedBy:      { type: mongoose.Schema.Types.ObjectId, refPath: "issuedByModel", required: true },
  issuedByModel: { type: String, enum: ["Admin","Shopkeeper"], required: true },
  items:         [invoiceItemSchema],
  subTotal:      { type: Number, required: true },
  tax:           { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  grandTotal:    { type: Number, required: true },
  paidAmount:    { type: Number, required: true },
  balanceDue:    { type: Number, required: true },
   status: {
    type: String,
    enum: ["pending", "paid", "partially_paid", "cancelled"],
    default: "pending"
  },
  paymentMethod: { type: String, enum: ["cash","credit"], default: "cash" },
  invoiceDate:   { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
