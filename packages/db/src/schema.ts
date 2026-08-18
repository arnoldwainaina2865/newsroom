import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Payload CMS owns the editorial collections (users, articles, sections,
 * tags, media) in this same Postgres database — see apps/web/payload.config.ts.
 * These tables own the business logic that doesn't need CMS editing:
 * subscriptions, metering, newsletter subscribers and sends.
 *
 * `payloadUserId` / `payloadArticleId` below are loose references (uuid,
 * no FK) to rows Payload manages, since Payload generates its own tables
 * and we don't want a hard cross-schema foreign key.
 */

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "monthly",
  "annual",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "mpesa",
]);

export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "pending", // awaiting double opt-in confirmation
  "confirmed",
  "unsubscribed",
]);

export const newsletterStatusEnum = pgEnum("newsletter_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    payloadUserId: uuid("payload_user_id").notNull(),
    plan: subscriptionPlanEnum("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("incomplete"),
    provider: paymentProviderEnum("provider").notNull(),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscriptions_payload_user_id_idx").on(table.payloadUserId),
    uniqueIndex("subscriptions_provider_subscription_id_idx").on(
      table.providerSubscriptionId,
    ),
  ],
);

/**
 * One row per (reader, article) per read. Distinct article count in the
 * current calendar month, for a given identity, is the paywall meter.
 * `anonId` lets us meter logged-out visitors via a cookie before they
 * create an account.
 */
export const articleReads = pgTable(
  "article_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    payloadUserId: uuid("payload_user_id"),
    anonId: text("anon_id"),
    payloadArticleId: uuid("payload_article_id").notNull(),
    readAt: timestamp("read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("article_reads_user_idx").on(table.payloadUserId, table.readAt),
    index("article_reads_anon_idx").on(table.anonId, table.readAt),
    index("article_reads_article_idx").on(table.payloadArticleId),
  ],
);

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    payloadUserId: uuid("payload_user_id"),
    status: subscriberStatusEnum("status").notNull().default("pending"),
    preferences: jsonb("preferences").$type<{ sections?: string[] }>(),
    confirmToken: text("confirm_token"),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("subscribers_email_idx").on(table.email),
    uniqueIndex("subscribers_unsubscribe_token_idx").on(
      table.unsubscribeToken,
    ),
  ],
);

export const newsletters = pgTable("newsletters", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: newsletterStatusEnum("status").notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const newsletterSends = pgTable(
  "newsletter_sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    newsletterId: uuid("newsletter_id")
      .notNull()
      .references(() => newsletters.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("newsletter_sends_unique_idx").on(
      table.newsletterId,
      table.subscriberId,
    ),
  ],
);

export const newslettersRelations = relations(newsletters, ({ many }) => ({
  sends: many(newsletterSends),
}));

export const newsletterSendsRelations = relations(
  newsletterSends,
  ({ one }) => ({
    newsletter: one(newsletters, {
      fields: [newsletterSends.newsletterId],
      references: [newsletters.id],
    }),
    subscriber: one(subscribers, {
      fields: [newsletterSends.subscriberId],
      references: [subscribers.id],
    }),
  }),
);

export const subscribersRelations = relations(subscribers, ({ many }) => ({
  sends: many(newsletterSends),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type ArticleRead = typeof articleReads.$inferSelect;
export type NewArticleRead = typeof articleReads.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type Newsletter = typeof newsletters.$inferSelect;
export type NewsletterSend = typeof newsletterSends.$inferSelect;
