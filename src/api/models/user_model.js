import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
        type: String,
        enum: ['admin', 'shopkeeper', 'salesperson'],
        required: true
    },
    // Role-specific fields
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // For shopkeeper/salesperson
    phoneNumber: String, // For salesperson
    isActive: { type: Boolean, default: true }
});
const UserModel = mongoose.model("User", userSchema);
export default UserModel;
