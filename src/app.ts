import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import requestsRoutes from "./routes/requests";

export function buildApp(opts: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? true });

  app.register(cors, {
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
    methods: ["GET", "POST", "PATCH"],
  });

  app.get("/", async () => {
    return { status: "ok" };
  });

  app.register(requestsRoutes);

  return app;
}
