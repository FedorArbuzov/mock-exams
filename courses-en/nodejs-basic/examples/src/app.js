import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import { config } from "./config.js";

export function createApp() {
  const app = express();
  const logger = pino({ level: config.logLevel });

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers["x-request-id"] ?? crypto.randomUUID(),
    })
  );

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "shop-bff" });
  });

  // TODO (labs 34+, capstone): proxy /api/v1/* → FastAPI

  app.use((err, req, res, _next) => {
    req.log?.error({ err }, "unhandled error");
    const isProd = config.nodeEnv === "production";
    res.status(err.status ?? 500).json({
      error: "internal_server_error",
      ...(isProd ? {} : { message: err.message }),
    });
  });

  return app;
}
