import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const checkoutSchema = z.object({
  payloadUserId: z.string().uuid(),
  email: z.string().email(),
  plan: z.enum(["monthly", "annual"]),
  provider: z.enum(["stripe", "mpesa"]),
});

export const paymentsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/checkout", async (request, reply) => {
    const body = checkoutSchema.parse(request.body);

    // TODO(Phase 3): resolve the concrete PaymentProvider from body.provider
    // and call provider.createCheckout(body). Persist a pending row in
    // `subscriptions` keyed by providerReference before returning.
    return reply.code(501).send({
      message: "Not implemented yet — Phase 3",
      received: body,
    });
  });
};
