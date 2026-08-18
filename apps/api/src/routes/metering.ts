import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, articleReads, subscriptions } from "@newsroom/db";
import { and, eq, gte, isNull, or, countDistinct } from "drizzle-orm";

const FREE_ARTICLES_PER_MONTH = 3;

const checkSchema = z.object({
  payloadUserId: z.string().uuid().optional(),
  anonId: z.string().optional(),
  payloadArticleId: z.string().uuid(),
});

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const meteringRoutes: FastifyPluginAsync = async (app) => {
  /**
   * Called server-side by apps/web before rendering an article body.
   * Returns whether the reader may see the full article, so the page
   * can truncate on the server — never ship the full body and hide it
   * with CSS.
   */
  app.post("/check", async (request, reply) => {
    const { payloadUserId, anonId, payloadArticleId } = checkSchema.parse(
      request.body,
    );

    if (payloadUserId) {
      const [activeSub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.payloadUserId, payloadUserId),
            eq(subscriptions.status, "active"),
          ),
        )
        .limit(1);

      if (activeSub) {
        return reply.send({ allowed: true, reason: "subscribed" as const });
      }
    }

    const identity = payloadUserId
      ? eq(articleReads.payloadUserId, payloadUserId)
      : eq(articleReads.anonId, anonId ?? "");

    const [{ value: distinctCount }] = await db
      .select({ value: countDistinct(articleReads.payloadArticleId) })
      .from(articleReads)
      .where(and(identity, gte(articleReads.readAt, startOfMonth())));

    const alreadyRead = distinctCount ?? 0;
    const allowed = alreadyRead < FREE_ARTICLES_PER_MONTH;

    if (allowed) {
      await db.insert(articleReads).values({
        payloadUserId: payloadUserId ?? null,
        anonId: payloadUserId ? null : (anonId ?? null),
        payloadArticleId,
      });
    }

    return reply.send({
      allowed,
      reason: allowed ? ("within_free_quota" as const) : ("quota_exceeded" as const),
      remaining: Math.max(0, FREE_ARTICLES_PER_MONTH - alreadyRead - (allowed ? 1 : 0)),
    });
  });
};
