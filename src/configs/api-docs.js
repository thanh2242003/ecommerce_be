'use strict';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

const json = (example = {}) => ({ type: 'json', example });
const multipart = (fields = []) => ({ type: 'multipart', fields });
const none = () => ({ type: 'none' });

const endpoint = (tag, method, path, summary, options = {}) => ({
  tag,
  method,
  path,
  summary,
  description: options.description || summary,
  auth: options.auth || false,
  status: options.status || 200,
  query: options.query || [],
  body: options.body || none(),
  notes: options.notes || '',
});

const endpoints = [
  endpoint('Auth', 'post', '/v1/api/user/signup', 'Register user', {
    status: 201,
    body: json({ email: 'user@example.com', password: 'password123', name: 'John Doe', phone: '0123456789' }),
  }),
  endpoint('Auth', 'post', '/v1/api/user/signin', 'Login user', {
    body: json({ email: 'user@example.com', password: 'password123' }),
  }),
  endpoint('Auth', 'post', '/v1/api/shop/signup', 'Register shop', {
    status: 201,
    body: json({ email: 'shop@example.com', password: 'password123', name: 'My Shop' }),
  }),
  endpoint('Auth', 'post', '/v1/api/shop/signin', 'Login shop', {
    body: json({ email: 'shop@example.com', password: 'password123' }),
  }),
  endpoint('Auth', 'post', '/v1/api/admin/auth/login', 'Admin login', {
    body: json({ account: 'admin', password: 'password123' }),
  }),
  endpoint('Auth', 'post', '/v1/api/logout', 'Logout current session', { auth: true }),
  endpoint('Auth', 'post', '/v1/api/handlerRefreshToken', 'Refresh access token', {
    body: json({ refreshToken: 'refresh-token' }),
  }),

  endpoint('User', 'get', '/v1/api/user/profile', 'Get current user profile', { auth: true }),
  endpoint('User', 'get', '/v1/api/user/reviews', 'Get current user reviews', { auth: true }),
  endpoint('User', 'patch', '/v1/api/user/profile', 'Update current user profile', {
    auth: true,
    body: json({ name: 'John Doe', phone: '0123456789', avatar: 'https://example.com/avatar.jpg' }),
  }),
  endpoint('User', 'patch', '/v1/api/user/password', 'Change current user password', {
    auth: true,
    body: json({ currentPassword: 'old-password', newPassword: 'new-password' }),
  }),
  endpoint('User', 'patch', '/v1/api/user/fcm-token', 'Update user FCM token', {
    auth: true,
    body: json({ token: 'fcm-token' }),
  }),
  endpoint('User', 'delete', '/v1/api/user/fcm-token', 'Remove user FCM token', { auth: true }),

  endpoint('Address', 'post', '/v1/api/address', 'Create address', {
    auth: true,
    status: 201,
    body: json({
      fullName: 'John Doe',
      phone: '0123456789',
      addressLine1: '12 Nguyen Trai',
      ward: 'Ward 1',
      district: 'District 1',
      province: 'Ho Chi Minh City',
      isDefault: true,
    }),
  }),
  endpoint('Address', 'get', '/v1/api/address', 'List addresses', { auth: true }),
  endpoint('Address', 'get', '/v1/api/address/default', 'Get default address', { auth: true }),
  endpoint('Address', 'put', '/v1/api/address/set-default/{id}', 'Set default address', { auth: true }),
  endpoint('Address', 'put', '/v1/api/address/{id}', 'Update address', {
    auth: true,
    body: json({ fullName: 'John Doe', phone: '0123456789', addressLine1: '12 Nguyen Trai' }),
  }),
  endpoint('Address', 'delete', '/v1/api/address/{id}', 'Delete address', { auth: true }),

  endpoint('Cart', 'post', '/v1/api/cart/add', 'Add item to cart', {
    auth: true,
    body: json({ productId: 'product-id', quantity: 1, size: 'M', color: 'Black' }),
  }),
  endpoint('Cart', 'post', '/v1/api/cart/update', 'Update cart item quantity', {
    auth: true,
    body: json({ productId: 'product-id', quantity: 2, size: 'M', color: 'Black' }),
  }),
  endpoint('Cart', 'delete', '/v1/api/cart', 'Delete cart item', {
    auth: true,
    body: json({ productId: 'product-id', size: 'M', color: 'Black' }),
  }),
  endpoint('Cart', 'get', '/v1/api/cart', 'Get cart', { auth: true }),

  endpoint('Category', 'get', '/v1/api/category', 'Get all categories'),
  endpoint('Category', 'get', '/v1/api/category/slug/{slug}', 'Get category by slug'),
  endpoint('Category', 'get', '/v1/api/category/{categoryId}', 'Get category by id'),
  endpoint('Category', 'post', '/v1/api/category', 'Create category', {
    auth: true,
    status: 201,
    body: multipart([
      { key: 'name', type: 'text', value: 'T-Shirts' },
      { key: 'description', type: 'text', value: 'Basic tee category' },
      { key: 'image', type: 'file', value: '' },
    ]),
  }),
  endpoint('Category', 'patch', '/v1/api/category/{categoryId}', 'Update category', {
    auth: true,
    body: multipart([
      { key: 'name', type: 'text', value: 'T-Shirts' },
      { key: 'description', type: 'text', value: 'Updated description' },
      { key: 'image', type: 'file', value: '' },
    ]),
  }),
  endpoint('Category', 'delete', '/v1/api/category/{categoryId}', 'Delete category', { auth: true }),
  endpoint('Category', 'post', '/v1/api/category/seed/default', 'Seed default categories', { auth: true }),

  endpoint('Checkout', 'post', '/v1/api/checkout/review', 'Checkout review', {
    auth: true,
    body: json({
      cartId: 'cart-id',
      userId: 'user-id',
      discountCode: 'SAVE10',
      shippingAddressId: 'address-id',
      paymentMethod: 'COD',
    }),
  }),

  endpoint('Discount', 'post', '/v1/api/discount/amount', 'Calculate discount amount', {
    body: json({ code: 'SAVE10', totalPrice: 150000 }),
  }),
  endpoint('Discount', 'get', '/v1/api/discount/list_product_code', 'List discount codes with products'),
  endpoint('Discount', 'post', '/v1/api/discount', 'Create shop discount code', {
    auth: true,
    status: 201,
    body: json({ code: 'SAVE10', value: 10, maxUses: 100, minOrderValue: 100000, startDate: '2026-01-01', endDate: '2026-12-31' }),
  }),
  endpoint('Discount', 'get', '/v1/api/discount', 'List shop discount codes', { auth: true }),
  endpoint('Discount', 'patch', '/v1/api/discount/{id}', 'Update discount code', {
    auth: true,
    body: json({ code: 'SAVE15', value: 15 }),
  }),
  endpoint('Discount', 'delete', '/v1/api/discount/{id}', 'Delete discount code', { auth: true }),

  endpoint('Inventory', 'post', '/v1/api/inventory', 'Create or update inventory', {
    auth: true,
    body: json({ productId: 'product-id', stock: 20, reserved: 0, warehouse: 'main' }),
  }),
  endpoint('Inventory', 'get', '/v1/api/inventory', 'Get shop inventory', { auth: true }),
  endpoint('Inventory', 'get', '/v1/api/inventory/summary', 'Get inventory summary', { auth: true }),
  endpoint('Inventory', 'get', '/v1/api/inventory/{id}', 'Get inventory by id', { auth: true }),
  endpoint('Inventory', 'patch', '/v1/api/inventory/{id}', 'Update inventory', {
    auth: true,
    body: json({ stock: 30, reserved: 2 }),
  }),
  endpoint('Inventory', 'delete', '/v1/api/inventory/{id}', 'Delete inventory', { auth: true }),

  endpoint('Notification', 'post', '/v1/api/fcm-token', 'Register FCM token', {
    auth: true,
    body: json({ token: 'fcm-token' }),
  }),
  endpoint('Notification', 'delete', '/v1/api/fcm-token', 'Delete FCM token', { auth: true }),
  endpoint('Notification', 'post', '/v1/api/notifications/send', 'Send notification as admin', {
    auth: true,
    body: json({ userId: 'user-id', title: 'Order update', body: 'Your order has been shipped.' }),
  }),
  endpoint('Notification', 'get', '/v1/api/notifications/{userId}', 'Get notifications by user', { auth: true }),
  endpoint('Notification', 'patch', '/v1/api/notifications/read/{id}', 'Mark notification as read', { auth: true }),
  endpoint('Notification', 'patch', '/v1/api/notifications/read-all/{userId}', 'Mark all notifications as read', { auth: true }),
  endpoint('Notification', 'get', '/v1/api/notifications/unread-count/{userId}', 'Get unread notification count', { auth: true }),
  endpoint('Notification', 'delete', '/v1/api/notifications/{id}', 'Delete notification', { auth: true }),

  endpoint('Order', 'post', '/v1/api/order/orders', 'Create order', {
    auth: true,
    status: 201,
    body: json({
      items: [{ productId: 'product-id', quantity: 1, size: 'M', color: 'Black' }],
      addressId: 'address-id',
      paymentMethod: 'COD',
      note: 'Leave at the door',
    }),
  }),
  endpoint('Order', 'get', '/v1/api/order/orders', 'Get my orders', { auth: true }),
  endpoint('Order', 'get', '/v1/api/order/orders/{id}', 'Get order by id', { auth: true }),
  endpoint('Order', 'patch', '/v1/api/order/orders/{id}/cancel', 'Cancel order', { auth: true }),

  endpoint('Product', 'get', '/v1/api/product/search', 'Search products', {
    query: [
      { name: 'q', value: 'shirt' },
      { name: 'categoryId', value: 'category-id' },
    ],
  }),
  endpoint('Product', 'get', '/v1/api/product/top-selling', 'Get top selling products', {
    query: [{ name: 'limit', value: '10' }],
  }),
  endpoint('Product', 'get', '/v1/api/product/suggested/{userId}', 'Get suggested products'),
  endpoint('Product', 'get', '/v1/api/product', 'Get products', {
    query: [
      { name: 'categoryId', value: 'category-id' },
      { name: 'minPrice', value: '100000' },
      { name: 'maxPrice', value: '500000' },
      { name: 'gender', value: '1' },
      { name: 'sort', value: '-createdAt' },
      { name: 'page', value: '1' },
      { name: 'limit', value: '20' },
    ],
  }),
  endpoint('Product', 'get', '/v1/api/product/{productId}/reviews', 'Get product reviews', {
    query: [
      { name: 'page', value: '1' },
      { name: 'limit', value: '10' },
    ],
  }),
  endpoint('Product', 'get', '/v1/api/product/{productId}', 'Get product detail'),
  endpoint('Product', 'post', '/v1/api/product/{productId}/reviews', 'Add review', {
    auth: true,
    body: json({ rating: 5, comment: 'Great product', images: [] }),
  }),
  endpoint('Product', 'patch', '/v1/api/product/{productId}/reviews/{reviewId}', 'Update review', {
    auth: true,
    body: json({ rating: 4, comment: 'Updated review' }),
  }),
  endpoint('Product', 'delete', '/v1/api/product/{productId}/reviews/{reviewId}', 'Delete review', { auth: true }),
  endpoint('Product', 'post', '/v1/api/product/{productId}/reviews/{reviewId}/reply', 'Reply to review as shop', {
    auth: true,
    body: json({ reply: 'Thanks for the feedback' }),
  }),
  endpoint('Product', 'post', '/v1/api/product', 'Create product', {
    auth: true,
    status: 201,
    body: multipart([
      { key: 'title', type: 'text', value: 'New T-Shirt' },
      { key: 'categoryId', type: 'text', value: 'category-id' },
      { key: 'price', type: 'text', value: '250000' },
      { key: 'gender', type: 'text', value: '1' },
      { key: 'description', type: 'text', value: 'Premium quality t-shirt' },
      { key: 'sizes', type: 'text', value: '["S","M","L"]' },
      { key: 'colors', type: 'text', value: '[{"title":"Black","rgb":[0,0,0]}]' },
      { key: 'variants', type: 'text', value: '[{"color":"Black","size":"M","stock":10}]' },
      { key: 'images', type: 'file', value: '' },
    ]),
  }),
  endpoint('Product', 'patch', '/v1/api/product/{productId}', 'Update product', {
    auth: true,
    body: multipart([
      { key: 'title', type: 'text', value: 'Updated T-Shirt' },
      { key: 'price', type: 'text', value: '270000' },
      { key: 'images', type: 'file', value: '' },
    ]),
  }),
  endpoint('Product', 'delete', '/v1/api/product/{productId}', 'Delete product', { auth: true }),
  endpoint('Product', 'get', '/v1/api/product/shop/drafts', 'Get draft products for shop', { auth: true }),
  endpoint('Product', 'get', '/v1/api/product/shop/published', 'Get published products for shop', { auth: true }),
  endpoint('Product', 'patch', '/v1/api/product/{productId}/publish', 'Publish product', { auth: true }),
  endpoint('Product', 'patch', '/v1/api/product/{productId}/unpublish', 'Unpublish product', { auth: true }),
  endpoint('Product', 'patch', '/v1/api/product/{id}/soft-delete', 'Soft delete product', { auth: true }),
  endpoint('Product', 'patch', '/v1/api/product/{id}/restore', 'Restore soft deleted product', { auth: true }),
  endpoint('Product', 'delete', '/v1/api/product/{id}/permanent', 'Permanently delete product', { auth: true }),
  endpoint('Product', 'get', '/v1/api/product/shop/deleted', 'Get deleted products', { auth: true }),

  endpoint('Search', 'post', '/v1/api/search/history', 'Save search history', {
    body: json({ userId: 'user-id', keyword: 'shirt' }),
  }),
  endpoint('Search', 'get', '/v1/api/search/history/{userId}', 'Get search history'),
  endpoint('Search', 'delete', '/v1/api/search/history/{userId}', 'Clear search history'),

  endpoint('Payment', 'post', '/api/payments/sepay/create', 'Create SePay payment', {
    auth: true,
    status: 201,
    body: json({ orderId: 'order-id' }),
  }),
  endpoint('Payment', 'get', '/api/payments/{paymentId}/status', 'Get payment status', {
    auth: true,
  }),
  endpoint('Payment', 'post', '/api/payments/sepay/webhook', 'SePay webhook callback', {
    body: json({
      id: 92704,
      gateway: 'Vietcombank',
      transactionDate: '2024-07-02 11:08:33',
      accountNumber: '1017588888',
      subAccount: '',
      code: 'OD3E8F2301020304',
      content: 'OD3E8F2301020304 chuyen tien',
      transferType: 'in',
      description: 'NGUYEN VAN A chuyen tien',
      transferAmount: 350000,
      accumulated: 105000000,
      referenceCode: 'FT24012345678',
    }),
  }),
  endpoint('Payment', 'get', '/api/payments/history', 'Get payment history', {
    auth: true,
    query: [
      { name: 'page', value: '1' },
      { name: 'limit', value: '10' },
    ],
  }),

  endpoint('Shop', 'get', '/v1/api/shop/orders', 'Get shop orders', { auth: true }),
  endpoint('Shop', 'get', '/v1/api/shop/orders/{id}', 'Get shop order detail', { auth: true }),
  endpoint('Shop', 'patch', '/v1/api/shop/orders/{id}/status', 'Update shop order status', {
    auth: true,
    body: json({ status: 'shipped' }),
  }),
  endpoint('Shop', 'get', '/v1/api/shop/dashboard', 'Get shop dashboard', { auth: true }),
  endpoint('Shop', 'get', '/v1/api/shop/status', 'Get shop status', { auth: true }),

  endpoint('Admin', 'get', '/v1/api/admin/profile', 'Get admin profile', { auth: true }),
  endpoint('Admin', 'get', '/v1/api/admin/shops', 'List shops', { auth: true }),
  endpoint('Admin', 'get', '/v1/api/admin/shops/{shopId}', 'Get shop by id', { auth: true }),
  endpoint('Admin', 'patch', '/v1/api/admin/shops/{shopId}/status', 'Update shop status', {
    auth: true,
    body: json({ status: 'active' }),
  }),
  endpoint('Admin', 'patch', '/v1/api/admin/shops/{shopId}/verify', 'Verify shop', { auth: true }),
  endpoint('Admin', 'get', '/v1/api/admin/users', 'List users', { auth: true }),
  endpoint('Admin', 'get', '/v1/api/admin/users/{userId}', 'Get user by id', { auth: true }),
  endpoint('Admin', 'patch', '/v1/api/admin/users/{userId}/status', 'Update user status', {
    auth: true,
    body: json({ status: 'active' }),
  }),
  endpoint('Admin', 'get', '/v1/api/admin/products', 'List products', { auth: true }),
  endpoint('Admin', 'patch', '/v1/api/admin/products/{id}/status', 'Update product status', {
    auth: true,
    body: json({ status: 'approved' }),
  }),
  endpoint('Admin', 'delete', '/v1/api/admin/products/{id}', 'Delete product as admin', { auth: true }),
  endpoint('Admin', 'get', '/v1/api/admin/orders', 'List orders', { auth: true }),
  endpoint('Admin', 'get', '/v1/api/admin/orders/{id}', 'Get order by id as admin', { auth: true }),
  endpoint('Admin', 'patch', '/v1/api/admin/orders/{id}/status', 'Update order status as admin', {
    auth: true,
    body: json({ status: 'completed' }),
  }),
  endpoint('Admin', 'get', '/v1/api/admin/analytics/overview', 'Get admin analytics overview', { auth: true }),
  endpoint('Admin', 'post', '/v1/api/admin/notifications/send-bulk', 'Send bulk notifications', {
    auth: true,
    body: json({
      title: 'Promotion',
      body: 'Weekend sale is live',
      userIds: ['user-id-1', 'user-id-2'],
    }),
  }),
  endpoint('Admin', 'post', '/v1/api/admin/discounts', 'Create platform discount', {
    auth: true,
    status: 201,
    body: json({ code: 'PLATFORM10', value: 10, scope: 'platform' }),
  }),
  endpoint('Admin', 'patch', '/v1/api/admin/discounts/{id}', 'Update platform discount', {
    auth: true,
    body: json({ value: 15 }),
  }),
  endpoint('Admin', 'delete', '/v1/api/admin/discounts/{id}', 'Delete platform discount', { auth: true }),
];

function inferSchema(example) {
  if (Array.isArray(example)) {
    const itemExample = example[0];
    return {
      type: 'array',
      items: itemExample === undefined ? { type: 'string' } : inferSchema(itemExample),
      example,
    };
  }

  if (example && typeof example === 'object') {
    const properties = {};
    for (const [key, value] of Object.entries(example)) {
      properties[key] = inferSchema(value);
    }

    return {
      type: 'object',
      properties,
      example,
    };
  }

  if (typeof example === 'number') {
    return { type: 'number', example };
  }

  if (typeof example === 'boolean') {
    return { type: 'boolean', example };
  }

  return { type: 'string', example: example === undefined ? '' : String(example) };
}

function buildPathParameters(path) {
  const matches = [...path.matchAll(/\{([^}]+)\}/g)];

  return matches.map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

function buildQueryParameters(query = []) {
  return query.map((item) => ({
    name: item.name,
    in: 'query',
    required: false,
    schema: { type: 'string', example: item.value },
    description: item.description || item.name,
  }));
}

function buildRequestBody(body) {
  if (!body || body.type === 'none') {
    return undefined;
  }

  if (body.type === 'json') {
    const schema = inferSchema(body.example);

    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: schema.type,
            properties: schema.properties,
            items: schema.items,
          },
          example: body.example,
        },
      },
    };
  }

  const properties = {};
  const required = [];
  for (const field of body.fields) {
    required.push(field.key);
    properties[field.key] = field.type === 'file'
      ? { type: 'string', format: 'binary' }
      : { type: 'string', example: field.value };
  }

  return {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required,
          properties,
        },
      },
    },
  };
}

function buildOpenApiSpec() {
  const paths = {};

  for (const item of endpoints) {
    if (!paths[item.path]) {
      paths[item.path] = {};
    }

    const parameters = [...buildPathParameters(item.path), ...buildQueryParameters(item.query)];
    const operation = {
      tags: [item.tag],
      summary: item.summary,
      description: item.notes || item.description,
      operationId: `${item.method}_${item.path.replace(/[\\/{}:-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')}`,
      parameters,
      responses: {
        [item.status]: {
          description: `${item.summary} success`,
          content: {
            'application/json': {
              example: {
                code: item.status,
                message: `${item.summary} successfully`,
                metadata: {},
              },
            },
          },
        },
      },
    };

    if (item.auth) {
      operation.security = [{ bearerAuth: [] }];
    }

    const requestBody = buildRequestBody(item.body);
    if (requestBody) {
      operation.requestBody = requestBody;
    }

    paths[item.path][item.method] = operation;
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'E-commerce Backend API',
      version: '1.0.0',
      description: 'Swagger/OpenAPI specification for the e-commerce backend endpoints.',
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: 'Auth' },
      { name: 'User' },
      { name: 'Address' },
      { name: 'Cart' },
      { name: 'Category' },
      { name: 'Checkout' },
      { name: 'Discount' },
      { name: 'Inventory' },
      { name: 'Notification' },
      { name: 'Order' },
      { name: 'Product' },
      { name: 'Search' },
      { name: 'Payment' },
      { name: 'Shop' },
      { name: 'Admin' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths,
  };
}

function buildPostmanCollection() {
  const folders = new Map();

  for (const item of endpoints) {
    if (!folders.has(item.tag)) {
      folders.set(item.tag, []);
    }

    const url = `{{base_url}}${item.path.replace(/\{([^}]+)\}/g, '{{$1}}')}`;
    const request = {
      name: item.summary,
      request: {
        method: item.method.toUpperCase(),
        header: [],
        url: {
          raw: url,
        },
      },
    };

    if (item.auth) {
      request.request.header.push({ key: 'Authorization', value: 'Bearer {{access_token}}', type: 'text' });
    }

    if (item.body.type === 'json') {
      request.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
      request.request.body = {
        mode: 'raw',
        raw: JSON.stringify(item.body.example, null, 2),
      };
    }

    if (item.body.type === 'multipart') {
      request.request.body = {
        mode: 'formdata',
        formdata: item.body.fields.map((field) => ({
          key: field.key,
          type: field.type === 'file' ? 'file' : 'text',
          value: field.value,
          disabled: false,
        })),
      };
    }

    if (item.query.length > 0) {
      request.request.url.query = item.query.map((query) => ({ key: query.name, value: query.value }));
    }

    folders.get(item.tag).push(request);
  }

  return {
    info: {
      name: 'E-commerce Backend API',
      description: 'Postman collection generated from the backend route definitions.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'base_url', value: baseUrl },
      { key: 'access_token', value: '' },
    ],
    item: [...folders.entries()].map(([name, items]) => ({ name, item: items })),
  };
}

module.exports = {
  baseUrl,
  endpoints,
  buildOpenApiSpec,
  buildPostmanCollection,
};