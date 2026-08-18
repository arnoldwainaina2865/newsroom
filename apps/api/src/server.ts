import Fastify from "fastify";
import cors from "@fastify/cors";
import { paymentsRoutes } from "./routes/payments";
import { webhooksRoutes } from "./routes/webhooks";
import { meteringRoutes } from "./routes/metering";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_URL ?? "http://localhost:3000",
});

app.get("/health", async () => ({ ok: true }));

await app.register(paymentsRoutes, { prefix: "/payments" });
await app.register(webhooksRoutes, { prefix: "/webhooks" });
await app.register(meteringRoutes, { prefix: "/metering" });

const port = Number(process.env.API_PORT ?? 4000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`API listening on :${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
