import express from 'express';
import connectDB from './config/database.js';
import loggerMiddleware from './api/middlewares/logger.js';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import authRouter from './api/routers/auth_router.js';
import customerRouter from './api/routers/customer_router.js';
import shopRouter from './api/routers/shop_router.js';
import productRouter from './api/routers/product_router.js';
import adminRouter from './api/routers/adminRouter.js';
import orderRouter from './api/routers/orderRouter.js';
import adminInvoiceRouter from './api/routers/adminInvoiceRouter.js';
import shopkeeperInvoiceRouter from './api/routers/shopkeeperinvoiceRouter.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
});

const upload = multer();  

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(loggerMiddleware);

app.get('/', (req, res) => {
  res.send('Hello World - Testing DD Agent');
});


app.use('/api/', authRouter);

app.use('/api/customers', customerRouter);
app.use('/api/shops', shopRouter);
app.use('/api/products', productRouter);
app.use('/api/assign-shop', adminRouter);
app.use('/api/orders', orderRouter);
app.use('/api/invoices/admin-shopkeeper', adminInvoiceRouter);
app.use('/api/invoices/shopkeeper-cusotmer', shopkeeperInvoiceRouter);



connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });
