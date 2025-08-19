import AuthModel from '../models/auth_model.js';

import ShopkeeperModel from '../models/shopkeeper_model.js';
import SalespersonModel from '../models/salesperson_model.js';

const login = async (req, res) => {
    try {
        const { email, password, role} = req.body;
        const user = await AuthModel.login({ email, password, role });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}



const register = async (req, res) => {
    try {
        console.log("registering user ", req.body);
        const user = await AuthModel.register(req.body);
        const token = await AuthModel.generateToken(user);
        return res.status(201).json({ ...user, token });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export { login, register };






// Get all shopkeepers
export const getAllShopkeepers = async (req, res) => {
  try {
    const shopkeepers = await ShopkeeperModel.find();
    res.status(200).json(shopkeepers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shopkeeper by ID
export const getShopkeeperById = async (req, res) => {
  try {
    const shopkeeper = await ShopkeeperModel.findById(req.params.id);
    if (!shopkeeper) return res.status(404).json({ message: "Shopkeeper not found" });
    res.status(200).json(shopkeeper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all salespersons
export const getAllSalespersons = async (req, res) => {
  try {
    const salespersons = await SalespersonModel.find();
    res.status(200).json(salespersons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get salesperson by ID
export const getSalespersonById = async (req, res) => {
  try {
    const salesperson = await SalespersonModel.findById(req.params.id);
    if (!salesperson) return res.status(404).json({ message: "Salesperson not found" });
    res.status(200).json(salesperson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block or Unblock Shopkeeper
export const toggleShopkeeperBlock = async (req, res) => {
  try {
    const shopkeeper = await ShopkeeperModel.findById(req.params.id);
    if (!shopkeeper) return res.status(404).json({ message: "Shopkeeper not found" });

    shopkeeper.isActive = !shopkeeper.isActive;
    await shopkeeper.save();
    res.status(200).json({ message: `Shopkeeper is now ${shopkeeper.isActive ? 'unblocked' : 'blocked'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block or Unblock Salesperson
export const toggleSalespersonBlock = async (req, res) => {
  try {
    const salesperson = await SalespersonModel.findById(req.params.id);
    if (!salesperson) return res.status(404).json({ message: "Salesperson not found" });

    salesperson.isActive = !salesperson.isActive;
    await salesperson.save();
    res.status(200).json({ message: `Salesperson is now ${salesperson.isActive ? 'unblocked' : 'blocked'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
