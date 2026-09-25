import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import requestsRoutes from "./routes/requests";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
  methods: ["GET", "POST", "PATCH"],
});

app.get("/", async () => {
  return { status: "ok" };
});

app.register(requestsRoutes);

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || "0.0.0.0",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
