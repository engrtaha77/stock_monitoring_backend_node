import mongoose from "mongoose";


const adminSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        default: "admin",
        immutable: true // Prevents changing the role
    }
});

const AdminModel = mongoose.model("Admin", adminSchema);
export default AdminModel;