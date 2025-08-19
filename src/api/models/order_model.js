import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },

  products: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
        barCode: 
        { type: String,required: true, unique: false},
      
      price: {
        type: Number, // Price at the time of order
        required: true,
      },
      name:{
        type: String,
        required: true
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "unpaid", "partial"],
    default: "unpaid",
  },
  orderDate: {
    type: Date,
default: Date.now,
  },
    invoices: [ 
    { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }
  ]
}, {
  timestamps: true,
});

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
