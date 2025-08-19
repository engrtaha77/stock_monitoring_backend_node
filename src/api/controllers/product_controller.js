import ProductModel from "../models/product_model.js";

// Create a new product (with proper ownership tracking)
export const createProduct = async (req, res) => {
  try {
    const { name, barCode, description, costPrice, sellingPrice, um, quantity, expiryDate } = req.body;
    const { id: userId, role } = req.user;
    const { shopId } = req.query;

    // Validate required fields
    const requiredFields = ['name', 'barCode', 'costPrice', 'sellingPrice', 'quantity'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields
      });
    }

    // Construct product data
    const productData = {
      name,
      barCode,
      description,
      costPrice,
      sellingPrice,
      um: um || 'pcs',
      quantity,
      expiryDate,
      createdBy: userId,
      createdByModel: role === 'admin' ? 'Admin' : 'Shopkeeper'
    };

    if (role === 'shopkeeper') {
      if (!shopId) {
        return res.status(400).json({ message: "Shopkeeper must be assigned to a shop" });
      }

      productData.shopId = shopId;

      // Check for duplicate in current shop only
      const existingProduct = await ProductModel.findOne({
        barCode,
        shopId,
        createdByModel: 'Shopkeeper'
      });

      if (existingProduct) {
        return res.status(400).json({
          message: "Product already exists in your shop",
          existingProduct: {
            id: existingProduct._id,
            name: existingProduct.name
          },
          suggestion: "Please update the existing product instead"
        });
      }
    }

    if (role === 'admin') {
      // Check for duplicate in admin scope only
      const existingAdminProduct = await ProductModel.findOne({
        barCode,
        createdByModel: 'Admin'
      });

      if (existingAdminProduct) {
        return res.status(400).json({
          message: "Barcode already exists in admin inventory",
          existingProduct: {
            id: existingAdminProduct._id,
            name: existingAdminProduct.name
          }
        });
      }
    }

    // Create the product
    const newProduct = await ProductModel.create(productData);

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct
    });

  } catch (error) {
    console.error("Product creation error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate product error",
        keyValue: error.keyValue,
        error: "This barcode already exists in the same context (shop or admin)"
      });
    }

    res.status(500).json({
      message: "Failed to create product",
      error: error.message
    });
  }
};
// Get all products with role-based filtering  that done   
export const getAllProducts = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const shopId = req.query.shopId;
    let filter = {};

    if (role === 'admin') {
      // Admin sees their own products, optionally include shopkeeper-created ones
      filter = {
        $or: [
          { createdByModel: 'Admin' },
          ...(req.query.includeShopProducts === 'true'
            ? [{ createdByModel: 'Shopkeeper' }]
            : [])
        ]
      };
    }

    else if (role === 'shopkeeper') {
      if (!shopId) {
        // Shopkeeper wants to see admin products only
        filter = { createdByModel: 'Admin' };
      } else {
        // Shopkeeper wants to see their own products (shop-specific)
        filter = {
          shopId,
          createdByModel: 'Shopkeeper'
        };
      }
    }

    else if (role === 'salesperson') {
      if (!shopId) {
        return res.status(400).json({ message: "shopId is required for salesperson" });
      }

      // Salesperson sees all products for their assigned shop
      filter = { shopId };
    }

    else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const products = await ProductModel.find(filter);
    res.status(200).json(products);

  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve products", error: error.message });
  }
};



// Get single product with ownership verification
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, shopId, id: userId } = req.user;

    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Admins can access all products
    if (role === 'admin') {
      return res.status(200).json(product);
    }

    // Shopkeeper: must be the one who created the product and shop must match
    if (role === 'shopkeeper') {
      if (
        product.createdByModel !== 'Shopkeeper' ||
        product.shopId?.toString() !== shopId ||
        product.createdBy?.toString() !== userId
      ) {
        return res.status(403).json({ message: "You do not have access to this product" });
      }
      return res.status(200).json(product);
    }

    // Salesperson: can access products created by Shopkeeper/Admin for their assigned shop
    if (role === 'salesperson') {
      if (
        product.shopId?.toString() !== shopId &&
        product.createdByModel !== 'Admin'
      ) {
        return res.status(403).json({ message: "Access denied to this product" });
      }
      return res.status(200).json(product);
    }

    // Default fallback
    return res.status(403).json({ message: "Unauthorized access" });

  } catch (error) {
    res.status(500).json({ message: "Error retrieving product", error: error.message });
  }
};

// Update a product with role-based and ownership checks
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    
    // Get shopId from either the user object or request body
    const shopId = req.user.shopId || req.body.shopId;
    
    if (!shopId && role !== 'admin') {
      return res.status(403).json({ 
        message: "Shop ID is required for shopkeepers",
        details: {
          receivedShopId: shopId,
          userRole: role
        }
      });
    }

    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Debug logs
    console.log('Update attempt:', {
      user: { role, userId, shopId },
      product: {
        createdBy: product.createdBy,
        shopId: product.shopId,
        createdByModel: product.createdByModel
      }
    });

    // Admin can update any product
    if (role !== 'admin') {
      // Shopkeepers cannot modify admin-created products
      if (product.createdByModel === 'Admin') {
        return res.status(403).json({ 
          message: "Shopkeepers cannot modify admin products",
          details: {
            productCreatorType: product.createdByModel
          }
        });
      }

      // Verify ownership for shopkeepers
      const isOwner = (
        product.createdByModel === 'Shopkeeper' &&
        product.shopId?.toString() === shopId &&
        product.createdBy?.toString() === userId
      );

      if (!isOwner) {
        return res.status(403).json({ 
          message: "You can only update your own products",
          details: {
            requiredConditions: {
              createdByModel: 'Shopkeeper',
              shopIdMatch: product.shopId?.toString() === shopId,
              createdByMatch: product.createdBy?.toString() === userId
            },
            actualValues: {
              productCreatedByModel: product.createdByModel,
              productShopId: product.shopId?.toString(),
              userShopId: shopId,
              productCreatedBy: product.createdBy?.toString(),
              userId: userId
            }
          }
        });
      }
    }

    // Prevent tampering with ownership fields
    const protectedFields = ['createdBy', 'createdByModel', 'shopId'];
    protectedFields.forEach(field => {
      if (req.body[field]) {
        delete req.body[field];
      }
    });

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ 
      message: "Failed to update product",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a product with proper role validation
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, shopId, id: userId } = req.user;

    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (role !== 'admin') {
      if (product.createdByModel === 'Admin') {
        return res.status(403).json({ message: "Cannot delete admin products" });
      }

      if (
        product.createdByModel !== 'Shopkeeper' ||
        product.shopId?.toString() !== shopId ||
        product.createdBy?.toString() !== userId
      ) {
        return res.status(403).json({ message: "You can only delete products you created" });
      }
    }

    await ProductModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};
