// ============================================================================
// PRODUCT VARIANTS SYSTEM - QUICK REFERENCE & EXAMPLES
// ============================================================================

/**
 * VARIANT SCHEMA (in Product model)
 * 
 * {
 *   _id: ObjectId,        // Unique identifier for this variant
 *   color: String,        // Must match one of colors.title
 *   size: String,         // Must match one of sizes
 *   stock: Number         // Inventory for this specific (color, size) combo
 * }
 */

// ============================================================================
// EXAMPLE 1: CREATE PRODUCT WITH AUTO-GENERATED VARIANTS
// ============================================================================

const createProductExample = {
  title: 'Classic T-Shirt',
  categoryId: '507f1f77bcf86cd799439011',
  price: 299000,
  discountedPrice: 199000,
  gender: 1,
  product_type: 'Clothing',
  product_shop: '507f1f77bcf86cd799439012',
  description: 'High-quality cotton t-shirt',
  
  // UI Display data
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  colors: [
    { title: 'Black', rgb: [0, 0, 0] },
    { title: 'White', rgb: [255, 255, 255] },
    { title: 'Red', rgb: [255, 0, 0] }
  ],
  
  images: ['url1', 'url2'],
  
  // ✅ variants will be AUTO-GENERATED on save!
  // No need to provide variants during creation
};

// After save, the product will look like:
const productAfterSave = {
  _id: '507f1f77bcf86cd799439013',
  title: 'Classic T-Shirt',
  categoryId: '507f1f77bcf86cd799439011',
  price: 299000,
  discountedPrice: 199000,
  
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  colors: [
    { _id: '507f...', title: 'Black', rgb: [0, 0, 0] },
    { _id: '507g...', title: 'White', rgb: [255, 255, 255] },
    { _id: '507h...', title: 'Red', rgb: [255, 0, 0] }
  ],
  
  // ✅ AUTO-GENERATED: 5 sizes × 3 colors = 15 variants
  variants: [
    { _id: '508a1...', color: 'Black', size: 'XS', stock: 0 },
    { _id: '508a2...', color: 'Black', size: 'S', stock: 0 },
    { _id: '508a3...', color: 'Black', size: 'M', stock: 0 },
    { _id: '508a4...', color: 'Black', size: 'L', stock: 0 },
    { _id: '508a5...', color: 'Black', size: 'XL', stock: 0 },
    { _id: '508b1...', color: 'White', size: 'XS', stock: 0 },
    { _id: '508b2...', color: 'White', size: 'S', stock: 0 },
    { _id: '508b3...', color: 'White', size: 'M', stock: 0 },
    { _id: '508b4...', color: 'White', size: 'L', stock: 0 },
    { _id: '508b5...', color: 'White', size: 'XL', stock: 0 },
    { _id: '508c1...', color: 'Red', size: 'XS', stock: 0 },
    { _id: '508c2...', color: 'Red', size: 'S', stock: 0 },
    { _id: '508c3...', color: 'Red', size: 'M', stock: 0 },
    { _id: '508c4...', color: 'Red', size: 'L', stock: 0 },
    { _id: '508c5...', color: 'Red', size: 'XL', stock: 0 }
  ],
  
  salesNumber: 0,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

// ============================================================================
// EXAMPLE 2: SET STOCK FOR VARIANTS (Admin)
// ============================================================================

// Update stock for Black/M variant
const updateStockExample = {
  // Using VariantHelper
  productId: '507f1f77bcf86cd799439013',
  variantId: '508a3...',  // Black/M
  newStock: 50
};

// After update:
const variantAfterStockUpdate = {
  _id: '508a3...',
  color: 'Black',
  size: 'M',
  stock: 50  // ✅ Updated
};

// ============================================================================
// EXAMPLE 3: CART ITEM (OLD vs NEW)
// ============================================================================

// ❌ OLD: Separate color and size (DON'T USE)
const oldCartItem = {
  product: '507f1f77bcf86cd799439013',
  color: 'Black',
  size: 'M',
  quantity: 2,
  price: 199000
};

// ✅ NEW: Use variantId (USE THIS)
const newCartItem = {
  product: '507f1f77bcf86cd799439013',
  variantId: '508a3...',  // ← Unique identifier for Black/M
  quantity: 2,
  price: 199000
};

// ============================================================================
// EXAMPLE 4: ADD TO CART (Frontend)
// ============================================================================

const addToCartRequest = {
  // POST /v1/api/cart/add
  productId: '507f1f77bcf86cd799439013',
  variantId: '508a3...',  // User selected: Black, size M
  quantity: 2
};

// Response:
const addToCartResponse = {
  status: 201,
  message: 'Add to cart successfully',
  metadata: {
    cartId: '509...',
    items: [
      {
        productId: '507f1f77bcf86cd799439013',
        variantId: '508a3...',
        productName: 'Classic T-Shirt',
        color: 'Black',
        size: 'M',
        price: 199000,
        quantity: 2,
        image: 'url1'
      }
    ],
    totalPrice: 398000
  }
};

// ============================================================================
// EXAMPLE 5: CREATE ORDER (Checkout)
// ============================================================================

const createOrderRequest = {
  // POST /v1/api/order/orders
  type: 'cart',
  addressId: '510f...'
};

// Order document created:
const orderDocumentExample = {
  _id: '511f...',
  userId: '507f1f77bcf86cd799439010',
  shopId: '507f1f77bcf86cd799439012',
  
  items: [
    {
      productId: '507f1f77bcf86cd799439013',
      variantId: '508a3...',  // ← Snapshot of which variant
      productName: 'Classic T-Shirt',
      price: 199000,
      quantity: 2,
      image: 'url1'
    },
    {
      productId: '507f1f77bcf86cd799439014',
      variantId: '509b2...',  // ← Different product, different variant
      productName: 'Jeans',
      price: 499000,
      quantity: 1,
      image: 'url2'
    }
  ],
  
  totalPrice: 697000,
  status: 'pending',
  createdAt: '2024-01-15T11:00:00Z'
};

// ✅ Stock deduction happens at variant level:
// Product 507f...: variants[508a3...].stock: 50 → 48
// Product 507f1f77bcf86cd799439014: variants[509b2...].stock: 20 → 19

// ============================================================================
// EXAMPLE 6: UPDATE PRODUCT SIZES/COLORS (Preserve Stock)
// ============================================================================

// Original product
const originalProduct = {
  _id: '507f1f77bcf86cd799439013',
  sizes: ['S', 'M', 'L'],
  colors: [
    { title: 'Black', rgb: [0, 0, 0] },
    { title: 'White', rgb: [255, 255, 255] }
  ],
  variants: [
    { _id: '508a1...', color: 'Black', size: 'S', stock: 10 },
    { _id: '508a2...', color: 'Black', size: 'M', stock: 15 },  // ← 15 units
    { _id: '508a3...', color: 'Black', size: 'L', stock: 8 },
    { _id: '508b1...', color: 'White', size: 'S', stock: 5 },
    { _id: '508b2...', color: 'White', size: 'M', stock: 12 },
    { _id: '508b3...', color: 'White', size: 'L', stock: 7 }
  ]
};

// Update: Add Red color and XL size
const updateProductPayload = {
  sizes: ['S', 'M', 'L', 'XL'],  // Added XL
  colors: [
    { title: 'Black', rgb: [0, 0, 0] },
    { title: 'White', rgb: [255, 255, 255] },
    { title: 'Red', rgb: [255, 0, 0] }  // Added Red
];
};

// After update and save(), variants are regenerated:
const updatedProductVariants = [
  // ✅ Existing: Black/S (preserved stock: 10)
  { _id: '508a1...', color: 'Black', size: 'S', stock: 10 },
  { _id: '508a2...', color: 'Black', size: 'M', stock: 15 },  // ✅ Stock preserved!
  { _id: '508a3...', color: 'Black', size: 'L', stock: 8 },
  // ✅ New: Black/XL (new variant, stock: 0)
  { _id: '508a4...', color: 'Black', size: 'XL', stock: 0 },
  
  // ✅ Existing: White variants (preserved)
  { _id: '508b1...', color: 'White', size: 'S', stock: 5 },
  { _id: '508b2...', color: 'White', size: 'M', stock: 12 },
  { _id: '508b3...', color: 'White', size: 'L', stock: 7 },
  // ✅ New: White/XL
  { _id: '508b4...', color: 'White', size: 'XL', stock: 0 },
  
  // ✅ New: All Red variants (new color, stock: 0)
  { _id: '508c1...', color: 'Red', size: 'S', stock: 0 },
  { _id: '508c2...', color: 'Red', size: 'M', stock: 0 },
  { _id: '508c3...', color: 'Red', size: 'L', stock: 0 },
  { _id: '508c4...', color: 'Red', size: 'XL', stock: 0 }
];

// ============================================================================
// EXAMPLE 7: BULK OPERATIONS
// ============================================================================

// Check multiple variants at once
const checkMultipleExample = [
  { productId: '507f1f77bcf86cd799439013', variantId: '508a3...', quantity: 2 },
  { productId: '507f1f77bcf86cd799439013', variantId: '508b2...', quantity: 1 },
  { productId: '507f1f77bcf86cd799439014', variantId: '509a1...', quantity: 5 }
];

// Result:
const checkMultipleResult = [
  { productId: '507f1f77bcf86cd799439013', variantId: '508a3...', available: true },
  { productId: '507f1f77bcf86cd799439013', variantId: '508b2...', available: true },
  { productId: '507f1f77bcf86cd799439014', variantId: '509a1...', available: false, error: 'Insufficient stock' }
];

// ============================================================================
// EXAMPLE 8: API ENDPOINTS SUMMARY
// ============================================================================

const apiEndpoints = {
  // Products
  createProduct: {
    method: 'POST',
    url: '/v1/api/product/products',
    body: createProductExample
  },
  
  getProduct: {
    method: 'GET',
    url: '/v1/api/product/products/:id'
    // Response includes: colors, sizes, variants
  },
  
  // Cart (NEW: uses variantId)
  addToCart: {
    method: 'POST',
    url: '/v1/api/cart/add',
    body: {
      productId: '507f1f77bcf86cd799439013',
      variantId: '508a3...',
      quantity: 2
    }
  },
  
  // Orders (NEW: creates with variantId snapshot)
  createOrder: {
    method: 'POST',
    url: '/v1/api/order/orders',
    body: {
      type: 'cart',
      addressId: '510f...'
    }
  }
};

// ============================================================================
// EXAMPLE 9: DATABASE QUERIES
// ============================================================================

// Find a specific variant's stock
const findVariantStock = {
  query: `db.products.findOne(
    { _id: ObjectId("507f1f77bcf86cd799439013") },
    { "variants": { $elemMatch: { _id: ObjectId("508a3...") } } }
  )`,
  result: {
    variants: [
      { _id: ObjectId("508a3..."), color: "Black", size: "M", stock: 50 }
    ]
  }
};

// Find products with low stock (< 5 units for any variant)
const lowStockQuery = {
  query: `db.products.find({ "variants.stock": { $lt: 5 } })`,
  projection: `{ title: 1, "variants.$": 1 }`
};

// Get total inventory for a product
const totalStockQuery = {
  query: `db.products.aggregate([
    { $match: { _id: ObjectId("507f1f77bcf86cd799439013") } },
    { $unwind: "$variants" },
    { $group: { _id: "$_id", totalStock: { $sum: "$variants.stock" } } }
  ])`
};

// ============================================================================
// KEY POINTS TO REMEMBER
// ============================================================================

/*
✅ DO:
  1. Use variantId in cart/order items (NOT color + size strings)
  2. Auto-generate variants when creating products (via pre-save hook)
  3. Check variant stock before deducting: VariantHelper.checkStock()
  4. Update stock at variant level: { $inc: { "variants.$.stock": -qty } }
  5. Use transactions (session) when deducting stock from multiple products
  6. Preserve stock when colors/sizes change: generateVariants() handles this
  7. Include variantId in order snapshots for audit trail

❌ DON'T:
  1. Use global stock field (only use variants[].stock)
  2. Pass color + size separately (use variantId reference)
  3. Manually create variants (use generateVariants())
  4. Forget to check stock before order
  5. Update variants array directly (use generateVariants())
  6. Skip transactions during inventory changes
  7. Lose track of which variant an order item refers to
*/
