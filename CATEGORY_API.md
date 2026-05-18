
**Category API**

- **Overview:** Endpoints for managing product categories. Public endpoints are readable; create/update/delete/seed are admin-only and require authentication via the app's admin middleware.
**Overview**
- **Purpose:** Quản lý danh mục sản phẩm (Category).
- **Base path:** `/v1/api/category`

**Authentication**
- Public: `GET` endpoints are public.
- Admin-only: `POST`, `PATCH`, `DELETE`, `POST /seed/default` require admin authentication (use `verifyAdmin` middleware / `Authorization: Bearer <token>`).

**Model (truncated)**
- `name` (String, required)
- `slug` (String, auto-generated)
- `description` (String)
- `image` (String) — URL ảnh lưu trên Cloudinary
- `isActive` (Boolean)

**Endpoints**

- **Get all categories**
	- Method: `GET`
	- URL: `/v1/api/category`
	- Auth: Public
	- Response (200):
		{
			"message": "Get all categories successfully!",
			"metadata": [ { /* category objects */ } ]
		}

- **Get category by slug**
	- Method: `GET`
	- URL: `/v1/api/category/slug/:slug`
	- Auth: Public
	- Response (200): same shape as above but single object in `metadata`.

- **Get category by id**
	- Method: `GET`
	- URL: `/v1/api/category/:categoryId`
	- Auth: Public

- **Create category (Admin)**
	- Method: `POST`
	- URL: `/v1/api/category`
	- Auth: Admin
	- Content-Type: `multipart/form-data`
	- Form fields:
		- `name` (string, required)
		- `description` (string, optional)
		- `image` (file, optional) — field name must be `image`
	- Example curl:
		```bash
		curl -X POST "https://<host>/v1/api/category" \
			-H "Authorization: Bearer <ADMIN_TOKEN>" \
			-F "name=Thời trang" \
			-F "description=Quần áo nam nữ" \
			-F "image=@/path/to/image.jpg"
		```
	- Response (200):
		{
			"message": "Create category successfully!",
			"metadata": { "_id": "...", "name": "...", "image": "https://...", ... }
		}

- **Update category (Admin)**
	- Method: `PATCH`
	- URL: `/v1/api/category/:categoryId`
	- Auth: Admin
	- Content-Type: `multipart/form-data`
	- Form fields (any of): `name`, `description`, `isActive` (boolean), `image` (file)
	- Example curl (replace image to update):
		```bash
		curl -X PATCH "https://<host>/v1/api/category/<CATEGORY_ID>" \
			-H "Authorization: Bearer <ADMIN_TOKEN>" \
			-F "name=Giày dép" \
			-F "image=@/path/to/new-image.png"
		```
	- Response (200):
		{
			"message": "Update category successfully!",
			"metadata": { /* updated category */ }
		}

- **Delete category (Admin)**
	- Method: `DELETE`
	- URL: `/v1/api/category/:categoryId`
	- Auth: Admin
	- Notes: Soft delete — `isActive` set to `false`.

- **Seed default categories (Admin)**
	- Method: `POST`
	- URL: `/v1/api/category/seed/default`
	- Auth: Admin
	- Response (200): `{ message: 'Default categories seeded successfully' }`

**Notes & Behavior**
- Uploaded images are sent to Cloudinary and stored as URLs in the `image` field of the Category document.
- Create/Update endpoints accept multipart/form-data; the file field name must be `image`.
- Validation errors return standard error responses (400/404) from the service layer.

**Files to check**
- Controller: [src/controllers/category.controller.js](src/controllers/category.controller.js)
- Service: [src/services/category.service.js](src/services/category.service.js)
- Routes: [src/routes/category/index.js](src/routes/category/index.js)
- Model: [src/models/category.model.js](src/models/category.model.js)

---
Generated on: 2026-05-18
