import {login, register} from '../controllers/auth_controller.js';
import express from 'express';
import authMiddleware, { authorizeRoles } from '../middlewares/auth.js';

import {
  getAllShopkeepers,
  getAllSalespersons,
  getShopkeeperById,
  getSalespersonById,
  toggleShopkeeperBlock,
  toggleSalespersonBlock
} from '../controllers/auth_controller.js';




const router = express.Router();

router.post('/login', login);
router.post('/register',register);



router.get('/shopkeepers', getAllShopkeepers);
router.get('/salespersons', getAllSalespersons);

router.get('/shopkeepers/:id', getShopkeeperById);
router.get('/salespersons/:id', getSalespersonById);

router.patch('/shopkeepers/:id/toggle-block', toggleShopkeeperBlock);
router.patch('/salespersons/:id/toggle-block', toggleSalespersonBlock);

export default router;