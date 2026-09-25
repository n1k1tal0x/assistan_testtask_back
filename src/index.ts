import "dotenv/config";
import Fastify from "fastify";
import requestsRoutes from "./routes/requests";

const app = Fastify({ logger: true });

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
