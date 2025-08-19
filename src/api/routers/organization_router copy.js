import { createOrganization, deleteOrganization, updateOrganization, getAllOrganizations, getOrganizationById } from "../controllers/organization_controller.js";

import express from 'express';
const router = express.Router();

router.post('/', createOrganization);
router.get('/', getAllOrganizations);
router.get('/:id', getOrganizationById);
router.delete('/:id', deleteOrganization);
router.put('/:id', updateOrganization);

export default router;