import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shopkeeper",
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  invoices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice"
    }
  ]
}, {
  timestamps: true
});

const CustomerModel = mongoose.model("Customer", customerSchema);
export default CustomerModel;
