# 06. DTO, JSON, validation

## DTO vs domain

**DTO** (request/response structs) sit at the HTTP boundary. Domain/store types can differ. Mapping keeps handlers thin and avoids leaking DB shapes to clients.

```go
type CreateItemRequest struct {
    Title       string `json:"title" validate:"required,min=1,max=200"`
    Description string `json:"description" validate:"max=2000"`
}

type ItemResponse struct {
    ID    int64  `json:"id"`
    Title string `json:"title"`
}
```

## Decode

```go
var req CreateItemRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    // 400
}
```

Limit body size: `http.MaxBytesReader`. Disallow unknown fields in stricter APIs with `decoder.DisallowUnknownFields()`.

## Validation

With `github.com/go-playground/validator/v10`:

```go
v := validator.New()
if err := v.Struct(req); err != nil {
    // 422 with field errors
}
```

Validate **after** decode. Return machine-readable field errors when you can.

## Checklist

- [ ] Separate request DTO from store model
- [ ] Validate length/required fields before insert

Next: [07. API errors](07-api-errors.md).
