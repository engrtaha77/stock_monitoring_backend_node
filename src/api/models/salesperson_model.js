import mongoose from "mongoose";


const salespersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shopId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  phoneNumber: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: "salesperson",
    immutable: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const SalespersonModel = mongoose.model("Salesperson", salespersonSchema);
export default SalespersonModel;
