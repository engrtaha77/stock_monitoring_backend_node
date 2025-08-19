import OrganizationModel from "../models/organization_model.js";
import { v4 as uuidv4 } from 'uuid';

const createOrganization = async (req, res) => {
    try {
        const {_id} = req.body;

        let id;
        if(!_id) {
            id = uuidv4();
        } else {
            id = _id;
        }
        const organization = new OrganizationModel({_id: id, ...req.body});
        await organization.save();
        res.status(201).send({organization, message: 'Organization created successfully'});
    } catch (error) {
        res.status(400).send(error);
    }
}


const getAllOrganizations = async (req, res) => {
    try {
        const organizations = await OrganizationModel.find();
        res.status(200).send(organizations);
    } catch (error) {
        res.status(500).send(error);
    }
}

const getOrganizationById = async (req, res) => {
    try {
        const organization = await OrganizationModel.findById(req.params.id);
        if (!organization) {
            return res.status(404).send('Organization not found');
        }
        res.status(200).send(organization);
    } catch (error) {
        res.status(500).send(error);
    }
}

const updateOrganization = async (req, res) => {
    try {
        const organization = await OrganizationModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!organization) {
            return res.status(404).send('Organization not found');
        }
        res.status(200).send({organization, message: 'Organization updated successfully'});
    }
    catch (error) {
        res.status.send(error);
    }
}

const deleteOrganization = async (req, res) => {
    try {
        const organization = await OrganizationModel.findByIdAndDelete(req.params.id);
        if (!organization) {
            return res.status(404).send('Organization not found');
        }
        res.status(200).send({message: 'Organization deleted successfully'});
    } catch (error) {
        res.status(500).send(error);
    }
}

export {
    createOrganization,
    getAllOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
}
