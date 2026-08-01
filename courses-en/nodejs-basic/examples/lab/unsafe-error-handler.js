/**
 * Lab for lesson 36: an intentionally unsafe error handler.
 * Compare with examples/src/app.js
 */
import express from "express";

const app = express();

app.get("/boom", (_req, _res) => {
  throw new Error("Demo failure with sensitive path: examples/src/routes/items.js");
});

app.use((err, _req, res, _next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
});

app.listen(3097, () => {
  console.log("Unsafe demo on http://localhost:3097/boom");
});
