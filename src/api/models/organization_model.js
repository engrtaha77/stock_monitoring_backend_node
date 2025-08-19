import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
    _id : {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        required: true,
    },
});

const OrganizationModel = mongoose.model("Organization", organizationSchema);

export default OrganizationModel;