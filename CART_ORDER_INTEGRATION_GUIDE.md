'use strict';

/**
 * CART & ORDER INTEGRATION WITH VARIANTS
 * 
 * This file shows how to update Cart and Order services
 * to work with the new variant system
 */

// ============================================================================
// 1. UPDATE CART MODEL TO USE variantId
// ============================================================================

const cartItemSchema = {
  // ✅ NEW: Use variantId instead of color + size
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },  // Reference to Product.variants._id
  
  // ❌ REMOVE: color and size (no longer needed)
  // color: String,
  // size: String,
  
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },  // Snapshot at time of add
  addedAt: { type: Date, default: Date.now }
};

// ============================================================================
// 2. UPDATE CART SERVICE - ADD TO CART
// ============================================================================

class CartServiceNew {
  /**
   * Add item to cart using variantId
   */
  static async addToCart({ userId, productId, variantId, quantity }) {
    const VariantHelper = require('../utils/variant.helper');
    
    // ✅ 1. Check variant exists and has stock
    await VariantHelper.checkStock(productId, variantId, quantity);
    
    // ✅ 2. Get product details for price snapshot
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    const variant = product.getVariant(variantId);
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }
    
    // Get price (discounted or regular)
    const price = product.discountedPrice > 0 ? product.discountedPrice : product.price;
    
    // ✅ 3. Add to cart with variantId
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          items: {
            product: productId,
            variantId,
            quantity,
            price,
            addedAt: new Date()
          }
        }
      },
      { new: true, upsert: true }
    ).populate('items.product');
    
    return cart;
  }

  /**
   * Update quantity (still uses variantId)
   */
  static async updateQuantity({ userId, productId, variantId, quantity }) {
    const VariantHelper = require('../utils/variant.helper');
    
    // ✅ Check stock for new quantity
    await VariantHelper.checkStock(productId, variantId, quantity);
    
    const cart = await Cart.findOneAndUpdate(
      {
        user: userId,
        'items.product': productId,
        'items.variantId': variantId
      },
      {
        $set: { 'items.$.quantity': quantity }
      },
      { new: true }
    );
    
    return cart;
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart({ userId, productId, variantId }) {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          items: {
            product: productId,
            variantId: variantId
          }
        }
      },
      { new: true }
    );
    
    return cart;
  }
}

// ============================================================================
// 3. UPDATE ORDER MODEL TO SNAPSHOT variantId
// ============================================================================

const orderItemSchema = {
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  
  // ✅ NEW: Snapshot the variantId used at order time
  variantId: { type: Schema.Types.ObjectId, required: true },
  
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  
  // ✅ OPTIONAL: Store color and size for reference (from variant)
  color: { type: String },
  size: { type: String }
};

// ============================================================================
// 4. UPDATE ORDER SERVICE - CREATE ORDER
// ============================================================================

class OrderServiceNew {
  static async createOrder({ userId, type, addressId }) {
    const VariantHelper = require('../utils/variant.helper');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ✅ Validate address
      const addressDoc = await Address.findOne({ _id: addressId, userId });
      if (!addressDoc) {
        throw new NotFoundError('Address not found');
      }

      let orderItems = [];
      let totalPrice = 0;
      let shopId = null;

      if (type === 'cart') {
        // ✅ Get cart with products populated
        const userCart = await Cart.findOne({ user: userId })
          .populate('items.product')
          .session(session);

        if (!userCart || !userCart.items.length) {
          throw new BadRequestError('Cart is empty');
        }

        // ✅ Process each cart item
        for (const item of userCart.items) {
          const product = item.product;

          if (!product) {
            throw new NotFoundError('Product not found for cart item');
          }

          // ✅ Extract shopId from first product (all must be same shop)
          if (!shopId) {
            shopId = product.product_shop;
            if (!shopId) {
              throw new BadRequestError('Product does not belong to any shop');
            }
          } else if (String(shopId) !== String(product.product_shop)) {
            throw new BadRequestError('All products must belong to same shop');
          }

          // ✅ Get variant details
          const variant = product.getVariant(item.variantId);
          if (!variant) {
            throw new NotFoundError('Variant not found');
          }

          // ✅ Check stock
          if (!product.hasStock(item.variantId, item.quantity)) {
            throw new BadRequestError(
              `Insufficient stock for "${product.title}" (${variant.color}, ${variant.size})`
            );
          }

          // ✅ Build order item with variantId snapshot
          const itemPrice = product.discountedPrice > 0 
            ? product.discountedPrice 
            : product.price;
          
          totalPrice += itemPrice * item.quantity;

          orderItems.push({
            productId: product._id,
            variantId: item.variantId,  // ✅ Include variantId
            productName: product.title,
            price: itemPrice,
            quantity: item.quantity,
            image: product.images[0] || '',
            color: variant.color,  // From variant
            size: variant.size      // From variant
          });

          // ✅ Deduct stock at variant level
          await Product.findByIdAndUpdate(
            product._id,
            { 
              $inc: { 
                'variants.$.stock': -item.quantity,
                salesNumber: item.quantity 
              } 
            },
            { session }
          );
        }

        // ✅ Clear cart after successful order
        userCart.items = [];
        userCart.totalPrice = 0;
        await userCart.save({ session });

      } else if (type === 'buy_now') {
        // Similar logic for buy_now but with single product
        // ...
      }

      // ✅ Create order document with variantId in items
      const newOrder = await Order.create([{
        userId,
        shopId,
        receiverName: addressDoc.receiverName,
        receiverPhone: addressDoc.receiverPhone,
        address: addressDoc.address,
        items: orderItems,  // ✅ Contains variantId
        totalPrice,
        status: 'pending'
      }], { session });

      await session.commitTransaction();
      return newOrder[0];

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancel order - restore stock
   */
  static async cancelOrder({ orderId, userId }) {
    const VariantHelper = require('../utils/variant.helper');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'pending') {
        throw new BadRequestError('Can only cancel pending orders');
      }

      // ✅ Restore stock for each item using variantId
      for (const item of order.items) {
        await VariantHelper.restoreStock(
          item.productId,
          item.variantId,  // ✅ Use saved variantId
          item.quantity,
          session
        );
      }

      // Update order status
      order.status = 'cancelled';
      await order.save({ session });

      await session.commitTransaction();
      return order;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// ============================================================================
// 5. API ENDPOINT EXAMPLES
// ============================================================================

/**
 * POST /v1/api/cart/add
 * Add item to cart using variantId
 */
const addToCartExample = {
  method: 'POST',
  path: '/v1/api/cart/add',
  
  request: {
    body: {
      productId: '507f1f77bcf86cd799439013',
      variantId: '508a3...',  // ← Use variant ID
      quantity: 2
    }
  },

  response: {
    status: 201,
    metadata: {
      cartId: '509...',
      items: [
        {
          product: '507f1f77bcf86cd799439013',
          variantId: '508a3...',
          quantity: 2,
          price: 199000,
          addedAt: '2024-01-15T10:30:00Z'
        }
      ],
      totalPrice: 398000
    }
  }
};

/**
 * POST /v1/api/order/orders
 * Create order - cart items use variantId
 */
const createOrderExample = {
  method: 'POST',
  path: '/v1/api/order/orders',
  
  request: {
    body: {
      type: 'cart',
      addressId: '510f...'
    }
  },

  response: {
    status: 201,
    metadata: {
      _id: '511f...',
      userId: '507f1f77bcf86cd799439010',
      shopId: '507f1f77bcf86cd799439012',
      items: [
        {
          productId: '507f1f77bcf86cd799439013',
          variantId: '508a3...',  // ✅ Snapshot of variant
          productName: 'Classic T-Shirt',
          color: 'Black',
          size: 'M',
          price: 199000,
          quantity: 2,
          image: 'url1'
        }
      ],
      totalPrice: 398000,
      status: 'pending',
      createdAt: '2024-01-15T11:00:00Z'
    }
  }
};

// ============================================================================
// 6. KEY MIGRATION STEPS
// ============================================================================

const migrationSteps = `
1. UPDATE CART MODEL:
   - Remove: color, size fields from cart items
   - Add: variantId field to reference Product.variants._id

2. UPDATE CART SERVICE:
   - addToCart(): Use variantId instead of color + size
   - updateQuantity(): Reference by variantId
   - removeFromCart(): Use variantId

3. UPDATE ORDER MODEL:
   - Add: variantId field to order items
   - Keep: color, size for reference (optional)

4. UPDATE ORDER SERVICE:
   - createOrder(): Use variantId from cart items
   - Snapshot variantId in order items for audit trail
   - Use VariantHelper.deductStock() and .restoreStock()

5. FRONTEND CHANGES:
   - When user selects color + size, get the variantId
   - Send variantId to cart/order endpoints (not color + size)
   - Display variant info from order items

6. TESTING:
   - Test adding items to cart with different variants
   - Verify stock deduction happens correctly
   - Test order cancellation and stock restoration
   - Verify product updates preserve variant stock
`;

// ============================================================================
// 7. MIGRATION SCRIPT (for existing data)
// ============================================================================

const migrationScript = `
const Product = require('./models/product.model');
const Cart = require('./models/cart.model');

async function migrateToVariants() {
  // 1. Generate variants for all products
  const products = await Product.find();
  for (const product of products) {
    product.generateVariants();
    await product.save();
  }
  console.log('✅ Generated variants for all products');

  // 2. Migrate cart items (if they had old format)
  // This depends on your old cart structure
  // You might need to manually map old color/size to new variantId
}

migrateToVariants().catch(console.error);
`;

module.exports = {
  CartServiceNew,
  OrderServiceNew,
  addToCartExample,
  createOrderExample,
  migrationSteps,
  migrationScript
};
