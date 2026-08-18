import type { FastifyPluginAsync } from "fastify";

export const webhooksRoutes: FastifyPluginAsync = async (app) => {
  // Stripe requires the raw body for signature verification — configure
  // a content-type parser that preserves it before parsing JSON elsewhere.
  app.post("/stripe", async (_request, reply) => {
    // TODO(Phase 3): verify signature via stripe.webhooks.constructEvent,
    // map to NormalizedEvent, upsert `subscriptions` idempotently (use the
    // Stripe event id as an idempotency key so retried deliveries are safe).
    return reply.code(501).send({ message: "Not implemented yet — Phase 3" });
  });

  app.post("/mpesa", async (_request, reply) => {
    // TODO(Phase 3): validate the Daraja callback, map to NormalizedEvent.
    return reply.code(501).send({ message: "Not implemented yet — Phase 3" });
  });
};
