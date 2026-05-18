# 📊 Sơ Đồ UML & Kiến Trúc - E-Commerce BE-Learning

## 1. Biểu Đồ UseCase Chi Tiết (Mermaid)

### 1.1 UseCase Toàn Hệ Thống

```mermaid
graph TB
    User["👤 Người Mua"]
    Shop["🏪 Cửa Hàng"]
    Admin["🔑 Admin"]
    Public["🌐 Public User"]
    
    System["E-Commerce System"]
    
    User -->|Browse| System
    User -->|Purchase| System
    User -->|Review| System
    Shop -->|Manage| System
    Shop -->|Sell| System
    Admin -->|Moderate| System
    Admin -->|Analytics| System
    Public -->|View| System
    Public -->|Search| System
    
    subgraph Functions["Core Functions"]
        Auth["🔐 Authentication"]
        Product["📦 Product Mgmt"]
        Order["📋 Order Mgmt"]
        Inventory["📊 Inventory"]
        Discount["🏷️ Discount"]
        Review["⭐ Reviews"]
        Dashboard["📈 Dashboard"]
    end
    
    System --> Functions
```

### 1.2 UseCase: Quy Trình Mua Hàng

```mermaid
graph LR
    A["👤 User"] -->|Sign In| B["🔐 Authenticated"]
    B -->|Browse Products| C["📦 Product List"]
    C -->|View Detail| D["📖 Product Detail"]
    D -->|Add to Cart| E["🛒 Shopping Cart"]
    E -->|Review Items| F["✓ Confirm Order"]
    F -->|Apply Discount| G["💰 Calculate Total"]
    G -->|Select Address| H["📍 Delivery Address"]
    H -->|Choose Payment| I["💳 Payment"]
    I -->|Confirm| J["✅ Order Created"]
    J -->|Track| K["📫 Order Status"]
    K -->|Delivery| L["🎁 Received"]
    L -->|Review| M["⭐ Add Review"]
    M -->|Complete| N["✔️ Done"]
```

### 1.3 UseCase: Quy Trình Bán Hàng (Shop)

```mermaid
graph LR
    Shop["🏪 Shop Owner"] -->|Sign In| Auth["🔐 Authenticated"]
    Auth -->|Create Product| P1["➕ Add Product"]
    P1 -->|Upload Images| P2["🖼️ Set Media"]
    P2 -->|Set Inventory| P3["📊 Add Stock"]
    P3 -->|Publish| P4["📤 Submit for Review"]
    P4 -->|Wait Admin| P5["⏳ Pending Approval"]
    P5 -->|Approved| P6["✅ Published"]
    
    Auth -->|Manage Discounts| D1["🏷️ Create Code"]
    D1 -->|Set Terms| D2["⚙️ Configure"]
    D2 -->|Activate| D3["🎯 Active"]
    
    Auth -->|Handle Orders| O1["📋 View Orders"]
    O1 -->|Confirm| O2["✓ Confirmed"]
    O2 -->|Process| O3["⚙️ Processing"]
    O3 -->|Ship| O4["📫 Shipped"]
    O4 -->|Deliver| O5["🎁 Delivered"]
    
    Auth -->|View Analytics| A1["📈 Dashboard"]
    A1 -->|Track Sales| A2["💹 Revenue"]
    A2 -->|View Insights| A3["📊 Analytics"]
```

### 1.4 UseCase: Admin Moderation

```mermaid
graph LR
    Admin["🔑 Admin"] -->|Login| Auth["🔐 Authenticated"]
    Auth -->|Review Products| P1["📦 Pending Products"]
    P1 -->|Approve| P2["✅ Approved"]
    P1 -->|Reject| P3["❌ Rejected"]
    
    Auth -->|Manage Shops| S1["🏪 All Shops"]
    S1 -->|Verify| S2["✔️ Verified"]
    S1 -->|Block| S3["🚫 Blocked"]
    
    Auth -->|Monitor Users| U1["👥 All Users"]
    U1 -->|View Activity| U2["📊 User Stats"]
    
    Auth -->|Manage Categories| C1["📚 Categories"]
    C1 -->|Create| C2["➕ New Category"]
    C1 -->|Update| C3["✏️ Edit"]
    
    Auth -->|View Reports| R1["📈 Analytics"]
    R1 -->|Sales Report| R2["💹 Revenue"]
    R1 -->|User Report| R3["👥 Users"]
    R1 -->|Order Report| R4["📋 Orders"]
```

---

## 2. Biểu Đồ Chuỗi (Sequence Diagram)

### 2.1 Luồng Tạo Đơn Hàng (Order Creation Flow)

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant OrderAPI as Order API
    participant DB as Database
    participant InventoryAPI as Inventory API
    
    User->>Client: Click "Checkout"
    Client->>OrderAPI: POST /checkout {cartItems, address}
    OrderAPI->>DB: Validate user & address
    DB-->>OrderAPI: ✓ Valid
    
    OrderAPI->>InventoryAPI: Check stock for all items
    InventoryAPI->>DB: Query inventory
    DB-->>InventoryAPI: Stock data
    InventoryAPI-->>OrderAPI: ✓ In stock
    
    OrderAPI->>DB: Create Order (status: pending)
    DB-->>OrderAPI: OrderId
    
    OrderAPI->>DB: Create CartItems snapshot
    DB-->>OrderAPI: ✓ Items saved
    
    OrderAPI->>InventoryAPI: Deduct stock
    InventoryAPI->>DB: Update inventory
    DB-->>InventoryAPI: ✓ Updated
    
    OrderAPI-->>Client: 201 Created {orderId}
    Client-->>User: Show Order Confirmation
    
    OrderAPI->>DB: Emit notification
    DB-->>OrderAPI: ✓ Notification sent
```

### 2.2 Luồng Xác Nhận Đơn (Order Confirmation by Shop)

```mermaid
sequenceDiagram
    participant Shop
    participant ShopApp
    participant ShopAPI as Shop API
    participant DB as Database
    participant NotificationAPI as Notification API
    
    Shop->>ShopApp: View Orders
    ShopApp->>ShopAPI: GET /shop/orders
    ShopAPI->>DB: Fetch orders (shopId, status=pending)
    DB-->>ShopAPI: Orders list
    ShopAPI-->>ShopApp: 200 Orders
    ShopApp-->>Shop: Display orders
    
    Shop->>ShopApp: Click "Confirm"
    ShopApp->>ShopAPI: PATCH /orders/{id}/status {status: 'confirmed'}
    
    ShopAPI->>DB: Validate order ownership
    DB-->>ShopAPI: ✓ Valid
    
    ShopAPI->>DB: Update order status
    DB-->>ShopAPI: ✓ Updated
    
    ShopAPI->>NotificationAPI: Send notification to user
    NotificationAPI->>DB: Create notification
    DB-->>NotificationAPI: ✓ Created
    
    NotificationAPI-->>ShopAPI: ✓ Sent
    ShopAPI-->>ShopApp: 200 Updated
    ShopApp-->>Shop: "Order Confirmed!"
```

### 2.3 Luồng Thanh Toán Giảm Giá (Discount Application)

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant CheckoutAPI as Checkout API
    participant DB as Database
    participant DiscountAPI as Discount API
    
    User->>Client: Enter discount code
    Client->>CheckoutAPI: POST /checkout/validate-discount {code}
    
    CheckoutAPI->>DiscountAPI: Validate code
    DiscountAPI->>DB: Find discount by code
    DB-->>DiscountAPI: Discount record
    
    alt Code exists & valid
        DiscountAPI->>DB: Check expiry, usedCount
        DB-->>DiscountAPI: ✓ Valid
        
        DiscountAPI->>DB: Check min order value
        DB-->>DiscountAPI: ✓ Meets requirement
        
        DiscountAPI->>DB: Check usesPerUser
        DB-->>DiscountAPI: ✓ User can use
        
        DiscountAPI-->>CheckoutAPI: {valid: true, discount: 20%, amount: 5000}
        CheckoutAPI->>CheckoutAPI: Calculate finalPrice
        CheckoutAPI-->>Client: 200 {totalPrice, discountAmount, finalPrice}
        Client-->>User: Show discounted total
    else Code invalid
        DiscountAPI-->>CheckoutAPI: {valid: false, reason: 'Expired'}
        CheckoutAPI-->>Client: 400 Invalid code
        Client-->>User: Show error
    end
```

### 2.4 Luồng Đánh Giá Sản Phẩm (Review Creation)

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant ProductAPI as Product API
    participant DB as Database
    participant NotificationAPI as Notification API
    
    User->>Client: Fill review form
    Client->>ProductAPI: POST /product/{id}/reviews {rating, content}
    
    ProductAPI->>DB: Validate user owns delivered order
    DB-->>ProductAPI: ✓ Valid order found
    
    ProductAPI->>ProductAPI: Validate rating (0-5)
    ProductAPI->>ProductAPI: Sanitize content
    
    ProductAPI->>DB: Add review to product.reviews[]
    DB-->>ProductAPI: ✓ Review added
    
    ProductAPI->>DB: Update product averageRating
    DB-->>ProductAPI: ✓ Updated
    
    ProductAPI->>NotificationAPI: Notify shop owner
    NotificationAPI->>DB: Create notification {type: 'review'}
    DB-->>NotificationAPI: ✓ Created
    
    ProductAPI-->>Client: 201 Created
    Client-->>User: "Review posted!"
    
    Note over NotificationAPI: Shop receives: "New review for product X"
```

### 2.5 Luồng Phê Duyệt Sản Phẩm (Admin Approval)

```mermaid
sequenceDiagram
    participant Admin
    participant AdminDash
    participant AdminAPI as Admin API
    participant DB as Database
    participant NotificationAPI as Notification API
    
    Admin->>AdminDash: View pending products
    AdminDash->>AdminAPI: GET /admin/products?status=pending
    AdminAPI->>DB: Fetch pending products
    DB-->>AdminAPI: Products list
    AdminAPI-->>AdminDash: 200 Products
    AdminDash-->>Admin: Show list
    
    Admin->>AdminDash: Click "Approve" + Add note
    AdminDash->>AdminAPI: PATCH /admin/products/{id}/status {status: 'approved', note: '...'}
    
    AdminAPI->>DB: Validate admin auth
    DB-->>AdminAPI: ✓ Valid
    
    AdminAPI->>DB: Update product {status: 'approved', moderatedBy, moderatedAt, moderationNote}
    DB-->>AdminAPI: ✓ Updated
    
    AdminAPI->>DB: Update product {isPublished: true}
    DB-->>AdminAPI: ✓ Published
    
    AdminAPI->>NotificationAPI: Notify shop owner
    NotificationAPI->>DB: Create notification {type: 'product_approved', data: {productId, note}}
    DB-->>NotificationAPI: ✓ Created
    
    AdminAPI-->>AdminDash: 200 Success
    AdminDash-->>Admin: "Product Approved!"
    
    Note over NotificationAPI: Shop receives: "Your product X has been approved!"
```

---

## 3. Class Diagram (Kiến Trúc Hệ Thống)

```mermaid
classDiagram
    class User {
        -ObjectId _id
        -String email
        -String password
        -String name
        -String phone
        -String avatar
        -String status
        -Boolean verify
        -Array roles
        +signUp()
        +signIn()
        +updateProfile()
        +logout()
    }
    
    class Shop {
        -ObjectId _id
        -String email
        -String password
        -String name
        -String status
        -Boolean verify
        -Date verifiedAt
        +signUp()
        +signIn()
        +verifyEmail()
        +blockAccount()
    }
    
    class Product {
        -ObjectId _id
        -String title
        -String slug
        -Number price
        -Array colors
        -Array sizes
        -Array variants
        -Array reviews
        -String status
        -Boolean isPublished
        +createProduct()
        +updateProduct()
        +publishProduct()
        +addReview()
    }
    
    class Inventory {
        -ObjectId _id
        -ObjectId productId
        -ObjectId shopId
        -Number totalQuantity
        -Number reserved
        -Array variants
        -String status
        +checkStock()
        +deductStock()
        +restoreStock()
        +updateStatus()
    }
    
    class Order {
        -ObjectId _id
        -ObjectId userId
        -ObjectId shopId
        -Array items
        -Number totalPrice
        -Number finalPrice
        -String status
        -String paymentMethod
        +createOrder()
        +updateStatus()
        +cancelOrder()
        +getOrderDetail()
    }
    
    class Cart {
        -ObjectId _id
        -ObjectId userId
        -Array items
        -Number totalPrice
        +addItem()
        +updateQuantity()
        +removeItem()
        +clear()
    }
    
    class Discount {
        -ObjectId _id
        -String code
        -String type
        -Number value
        -Date startDate
        -Date expiryDate
        -Number maxUses
        +validateCode()
        +applyDiscount()
        +calculateDiscount()
    }
    
    class Notification {
        -ObjectId _id
        -ObjectId userId
        -String title
        -String body
        -String type
        -Boolean isRead
        +createNotification()
        +markAsRead()
        +deleteNotification()
    }
    
    class Address {
        -ObjectId _id
        -ObjectId userId
        -String receiverName
        -String receiverPhone
        -String address
        -Boolean isDefault
        +addAddress()
        +updateAddress()
        +deleteAddress()
    }
    
    class Category {
        -ObjectId _id
        -String name
        -String slug
        -String description
        -ObjectId adminId
        +createCategory()
        +updateCategory()
        +deleteCategory()
    }
    
    class Admin {
        -ObjectId _id
        -String account
        -String password
        -String name
        -Array roles
        -Array permissions
        +login()
        +verifyProduct()
        +manageShops()
        +viewAnalytics()
    }
    
    %% Relationships
    User "1" -- "*" Cart : has
    User "1" -- "*" Order : creates
    User "1" -- "*" Notification : receives
    User "1" -- "*" Address : has
    User "1" -- "*" Product : reviews
    
    Shop "1" -- "*" Product : sells
    Shop "1" -- "*" Order : receives
    Shop "1" -- "*" Discount : creates
    Shop "1" -- "*" Inventory : manages
    
    Product "1" -- "1" Inventory : has
    Product "*" -- "1" Category : belongs_to
    
    Cart "*" -- "*" Product : contains
    
    Order "*" -- "*" Product : contains_items
    
    Discount "*" -- "1" Shop : belongs_to
    Discount "*" -- "*" User : used_by
    
    Category "1" -- "*" Product : contains
```

---

## 4. Biểu Đồ Trạng Thái (State Diagram)

### 4.1 Order Status Flow

```mermaid
stateDiagram-v2
    [*] --> Pending: Created
    
    Pending --> Confirmed: Shop confirms
    Pending --> Cancelled: User/Shop/Admin cancels
    
    Confirmed --> Processing: Shop prepares
    Confirmed --> Cancelled: Shop cancels
    
    Processing --> Shipped: Handed to carrier
    Processing --> Cancelled: Shop cancels
    
    Shipped --> Delivered: Delivered to user
    Shipped --> Cancelled: Cancelled in transit (special case)
    
    Delivered --> [*]: Complete
    Cancelled --> [*]: Complete (no refund processing shown)
    
    note right of Pending
        Order just created
        Waiting for shop confirmation
    end note
    
    note right of Confirmed
        Shop confirmed order
        Starting preparation
    end note
    
    note right of Processing
        Shop is packing
        Preparing for shipment
    end note
    
    note right of Shipped
        Order handed to carrier
        Tracking available
    end note
    
    note right of Delivered
        User received order
        Can now review
    end note
    
    note right of Cancelled
        Order cancelled
        Stock restored
    end note
```

### 4.2 Product Status Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Created by shop
    
    Draft --> Draft: Edit
    Draft --> Submitted: Submit for approval
    
    Submitted --> Approved: Admin approves
    Submitted --> Rejected: Admin rejects
    
    Approved --> Published: Auto-publish
    Published --> Published: Shop can edit
    Published --> UnPublished: Shop unpublishes
    
    Rejected --> Draft: Shop revises
    
    UnPublished --> Published: Shop republishes
    
    Published --> Deleted: Hard/Soft delete
    UnPublished --> Deleted: Hard/Soft delete
    Deleted --> Restored: Soft restore
    
    Restored --> Published
    
    note right of Draft
        Shop has full control
        Not visible to users
        Can be edited/deleted
    end note
    
    note right of Submitted
        Awaiting admin review
        Not visible to customers
    end note
    
    note right of Approved
        Admin approved
        Ready to publish
    end note
    
    note right of Published
        Public can view
        Can be purchased
    end note
    
    note right of Deleted
        Soft delete: recoverable
        Hard delete: permanent
    end note
```

### 4.3 Shop Status Flow

```mermaid
stateDiagram-v2
    [*] --> Inactive: Signed up
    
    Inactive --> Active: Admin verifies
    Inactive --> Blocked: Admin blocks
    
    Active --> Blocked: Admin blocks
    Blocked --> Inactive: Admin unblocks
    Blocked --> Active: Admin reverifies
    
    Active --> [*]: Account closed (future feature)
    
    note right of Inactive
        Awaiting admin verification
        Cannot access API
    end note
    
    note right of Active
        Verified & operational
        Full API access
    end note
    
    note right of Blocked
        Blocked by admin
        Cannot access API
        Reason recorded
    end note
```

---

## 5. Component Diagram (Kiến Trúc Hệ Thống)

```mermaid
graph TB
    subgraph Client ["🖥️ CLIENT LAYER"]
        WEB["Web Browser"]
        MOBILE["Mobile App"]
    end
    
    subgraph API ["🔌 API LAYER"]
        AUTH["Auth API"]
        PRODUCT["Product API"]
        ORDER["Order API"]
        CART["Cart API"]
        SHOP["Shop API"]
        ADMIN["Admin API"]
        NOTIF["Notification API"]
        DISCOUNT["Discount API"]
    end
    
    subgraph SERVICE ["⚙️ SERVICE LAYER"]
        AUTH_SVC["Auth Service"]
        PRODUCT_SVC["Product Service"]
        ORDER_SVC["Order Service"]
        INVENTORY_SVC["Inventory Service"]
        DISCOUNT_SVC["Discount Service"]
        NOTIF_SVC["Notification Service"]
    end
    
    subgraph EXTERNAL ["🌐 EXTERNAL SERVICES"]
        CLOUDINARY["☁️ Cloudinary (Images)"]
        FIREBASE["🔥 Firebase (FCM)"]
        PAYMENT["💳 Payment Gateway"]
        EMAIL["📧 Email Service"]
    end
    
    subgraph DATA ["💾 DATA LAYER"]
        MONGODB["📊 MongoDB"]
        REDIS["⚡ Redis (Cache)"]
    end
    
    subgraph AUTH_LAYER ["🔐 AUTHENTICATION"]
        JWT["JWT Tokens"]
        REFRESH["Refresh Tokens"]
        API_KEY["API Key Validation"]
    end
    
    WEB -->|REST API| API
    MOBILE -->|REST API| API
    
    AUTH -->|Validate| AUTH_LAYER
    PRODUCT -->|Service Call| PRODUCT_SVC
    ORDER -->|Service Call| ORDER_SVC
    CART -->|Service Call| PRODUCT_SVC
    SHOP -->|Service Call| ORDER_SVC
    ADMIN -->|Service Call| PRODUCT_SVC
    NOTIF -->|Service Call| NOTIF_SVC
    DISCOUNT -->|Service Call| DISCOUNT_SVC
    
    PRODUCT_SVC -->|Query/Mutation| MONGODB
    ORDER_SVC -->|Query/Mutation| MONGODB
    INVENTORY_SVC -->|Query/Mutation| MONGODB
    DISCOUNT_SVC -->|Query/Mutation| MONGODB
    NOTIF_SVC -->|Query/Mutation| MONGODB
    
    PRODUCT_SVC -->|Cache| REDIS
    INVENTORY_SVC -->|Cache| REDIS
    
    PRODUCT_SVC -->|Upload| CLOUDINARY
    NOTIF_SVC -->|Send| FIREBASE
    NOTIF_SVC -->|Send| EMAIL
    ORDER_SVC -->|Process| PAYMENT
    
    style Client fill:#e1f5ff
    style API fill:#f3e5f5
    style SERVICE fill:#e8f5e9
    style EXTERNAL fill:#fff3e0
    style DATA fill:#fce4ec
    style AUTH_LAYER fill:#f1f8e9
```

---

## 6. Data Flow Diagram (DFD)

```mermaid
graph TB
    subgraph User_Actions ["👤 USER ACTIONS"]
        U1["Browse Products"]
        U2["Add to Cart"]
        U3["Checkout"]
        U4["Track Order"]
        U5["Review Product"]
    end
    
    subgraph Shop_Actions ["🏪 SHOP ACTIONS"]
        S1["Create Product"]
        S2["Manage Inventory"]
        S3["View Orders"]
        S4["Confirm Order"]
        S5["Create Discount"]
    end
    
    subgraph Admin_Actions ["🔑 ADMIN ACTIONS"]
        A1["Review Products"]
        A2["Verify Shop"]
        A3["Manage Users"]
        A4["View Analytics"]
    end
    
    subgraph Processing ["⚙️ DATA PROCESSING"]
        P1["Calculate Price"]
        P2["Check Stock"]
        P3["Apply Discount"]
        P4["Create Order"]
        P5["Update Inventory"]
    end
    
    subgraph Data_Store ["💾 DATA STORE"]
        D1["Products"]
        D2["Orders"]
        D3["Inventory"]
        D4["Users"]
        D5["Discounts"]
    end
    
    subgraph Output ["📤 OUTPUT"]
        O1["Notification"]
        O2["Receipt"]
        O3["Report"]
        O4["Analytics"]
    end
    
    U1 -->|Search| P1
    U2 -->|Add| P2
    U3 -->|Checkout| P3
    U3 -->|Submit| P4
    U4 -->|Track| D2
    U5 -->|Review| D1
    
    S1 -->|Create| P5
    S2 -->|Update| D3
    S3 -->|View| D2
    S4 -->|Confirm| P4
    S5 -->|Create| D5
    
    A1 -->|Approve| P5
    A2 -->|Verify| D4
    A3 -->|Monitor| D4
    A4 -->|Analyze| O4
    
    P1 --> D5
    P2 --> D3
    P3 --> D5
    P4 --> D2
    P5 --> D3
    
    D2 --> O1
    D2 --> O2
    D2 --> O3
    
    style User_Actions fill:#bbdefb
    style Shop_Actions fill:#c8e6c9
    style Admin_Actions fill:#ffe0b2
    style Processing fill:#f8bbd0
    style Data_Store fill:#b2dfdb
    style Output fill:#fff9c4
```

---

## 7. Biểu Đồ Mối Quan Hệ Chi Tiết (Detailed Relationship)

### 7.1 Product - Variant - Inventory Relationship

```mermaid
graph TB
    subgraph Product_View ["📦 PRODUCT LEVEL"]
        P["Product"]
        P -->|has| Colors["Colors[]"]
        P -->|has| Sizes["Sizes[]"]
        Colors -->|R,G,B| Color1["Color 1"]
        Color1 -->|combinations| Var["Variants[]"]
    end
    
    subgraph Variant_View ["🎨 VARIANT LEVEL"]
        V1["Variant"]
        V1 -->|Color: Red| C["color: 'Red'"]
        V1 -->|Size: M| S["size: 'M'"]
        V1 -->|Stock in Product| Stock1["stock: 10"]
    end
    
    subgraph Inventory_View ["📊 INVENTORY LEVEL"]
        I["Inventory"]
        I -->|Total| Total["totalQuantity: 50"]
        I -->|Mirror| Variants2["variants[]"]
        Variants2 -->|Mirror| V2["color, size, stock"]
    end
    
    Var -.->|Mirror| Variants2
    V1 -.->|Points to| V2
    
    Note over Product_View,Variant_View,Inventory_View
        Each (Color + Size) = 1 Variant
        Inventory mirrors Product.variants for tracking
        Deduction happens at Inventory, not Product
    end
```

### 7.2 Order - CartItem - Product Relationship

```mermaid
graph TB
    subgraph Order_Time ["📋 AT ORDER TIME"]
        Order["Order"]
        Order -->|contains| Items["items[]"]
        Items -->|snapshot| Item["OrderItem"]
        Item -->|productId| PID["Product ID"]
        Item -->|variantId| VID["Variant ID"]
        Item -->|price| Price["Price (frozen)"]
        Item -->|quantity| Qty["Quantity"]
    end
    
    subgraph Later ["⏳ LATER (Price Changes)"]
        Product_Later["Product (updated)"]
        Product_Later -->|price| NewPrice["$100"]
        Order -->|STILL HAS| OldPrice["$80"]
    end
    
    Note over Order_Time,Later
        Order snapshots prices at creation time
        Prevents price disputes later
        If product price changes, order is unaffected
    end
```

---

## 8. Deployment Architecture

```mermaid
graph TB
    subgraph Cloud ["☁️ CLOUD INFRASTRUCTURE"]
        LB["🔄 Load Balancer"]
        
        subgraph Instances ["🖥️ Application Instances"]
            A1["Instance 1"]
            A2["Instance 2"]
            A3["Instance 3"]
        end
        
        subgraph Database ["💾 Database Layer"]
            MONGO["MongoDB (Primary)"]
            MONGO_REPLICA["MongoDB Replica"]
        end
        
        subgraph Cache ["⚡ Cache Layer"]
            REDIS["Redis Cluster"]
        end
    end
    
    subgraph External ["🌐 EXTERNAL SERVICES"]
        CLOUDINARY["Cloudinary (CDN)"]
        FIREBASE["Firebase (Notifications)"]
        PAYMENT["Payment Gateway"]
    end
    
    Users["👥 Users"] -->|HTTPS| LB
    LB -->|Route| A1
    LB -->|Route| A2
    LB -->|Route| A3
    
    A1 -->|Read/Write| MONGO
    A2 -->|Read/Write| MONGO
    A3 -->|Read/Write| MONGO
    
    MONGO -->|Replicate| MONGO_REPLICA
    
    A1 -->|Cache| REDIS
    A2 -->|Cache| REDIS
    A3 -->|Cache| REDIS
    
    A1 -->|Upload| CLOUDINARY
    A1 -->|Push| FIREBASE
    A1 -->|Payment| PAYMENT
    
    style Cloud fill:#e3f2fd
    style Database fill:#f3e5f5
    style Cache fill:#e8f5e9
    style External fill:#fff3e0
```

---

**Lưu ý:** 
- Các sơ đồ Mermaid trên có thể được render trong GitHub, GitLab, hay các tool hỗ trợ Mermaid khác
- Để xem các biểu đồ interactively, sử dụng [Mermaid Live Editor](https://mermaid.live)

---

**Cập Nhật Lần Cuối:** 18 Tháng 5, 2026
**Phiên Bản:** 1.0.0
