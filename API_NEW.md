(**Shop**) GET /v1/api/product/shop/:productId

- **Description**: Retrieve full product detail for the owning shop. Returns the product even if it is draft, unpublished, or not approved. Ownership check applied — only the shop that owns the product may access this endpoint.
- **Auth**: `shopAuthenticationV2` (shop token required)
- **Permissions**: The `product_shop` field of the product must match the authenticated `shopId`.

- **Request**:

```bash
curl -H "Authorization: Bearer <SHOP_TOKEN>" \
	"http://localhost:3000/v1/api/product/shop/606..."
```

- **Successful response (200)**: returns product object (same shape as public detail endpoint). Example:

```json
{
	"message": "Get product successfully!",
	"metadata": {
		"_id": "606...",
		"title": "Example Product",
		"description": "...",
		"price": 100000,
		"isPublished": false,
		"status": "pending",
		"product_shop": "69bad18e38830c44e8185c0b",
		"variants": [ /* ... */ ],
		"images": [ /* ... */ ]
	}
}
```

- **Errors**:
	- `400 BadRequestError("Invalid product ID format")` — invalid id
	- `400 BadRequestError("Product not found")` — product does not exist
	- `400 BadRequestError("Permission denied")` — authenticated shop does not own the product

- **Notes**:
	- This endpoint is intended for shop management UIs to let shops view and edit their own products regardless of publish/approval state.
