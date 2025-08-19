import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import AdminModel from './admin_model.js';
import ShopkeeperModel from './shopkeeper_model.js';
import SalespersonModel from './salesperson_model.js';

const AuthModel = {

  async register(data) {
    try {

      let user;

      console.log(data);

      const {name, email, password, role} = data;

      data.password = await this.hashPassword(password);


      if(data.role === "admin"){
        const adminExists = await AdminModel.findOne({ email });
        if (adminExists) {
          throw new Error('Admin already registered with this email');
        } else {
          user = await AdminModel.create({name, email, password: data.password});
        }
      } else if (data.role === "shopkeeper"){
        const shopkeeperExists = await ShopkeeperModel.findOne({ email });
        if (shopkeeperExists) {
          throw new Error('Shopkeeper already registered with this email');
        } else {
          console.log("shopkeeper created");
          user = await ShopkeeperModel.create({name, email, password: data.password});
        }
      } else if (data.role === "salesperson"){
        const salespersonExists = await SalespersonModel.findOne({ email });
        if (salespersonExists) {
          throw new Error('Salesperson already registered with this email');
        } else {
          user = await SalespersonModel.create({name, email, password: data.password});
        }
      }

      return {user};
    } catch (error) {
      throw error;
    }
  },

async login({ email, password, role }) {
    let user;
    try {
        if(role === "admin"){
            user = await AdminModel.findOne({ email });
            if (!user) throw new Error('Admin not found');
            user.role = "admin"; // Manually add role
        } else if(role === "shopkeeper"){
            user = await ShopkeeperModel.findOne({ email });
            if (!user) throw new Error('Shopkeeper not found');
            user.role = "shopkeeper"; // Manually add role
        } else if(role === "salesperson"){
            user = await SalespersonModel.findOne({ email });
            if (!user) throw new Error('Salesperson not found');
            user.role = "salesperson"; // Manually add role
        } else {
            throw new Error('Invalid role');
        }
        
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) throw new Error('Invalid password');
        
        const token = await this.generateToken(user);
        return { user, token };
    } catch (error) {
        throw error;
    }
},

  async resetPassword({ email, oldPassword, newPassword }) {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordMatch) {
        throw new Error('Invalid password');
      }
      const hashedPassword = await this.hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  },

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  },

  async generateToken(user) {
   const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: '1d' }
);
    return token;
  },

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await UserModel.findById(decoded.userId);
      return user;
    } catch (error) {
      throw error;
    }
  }

};

export default AuthModel;
