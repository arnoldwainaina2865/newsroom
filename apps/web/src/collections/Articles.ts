import type { CollectionConfig } from "payload";

/**
 * `accessTier` + the `article_reads` table in packages/db together are the
 * paywall: free/premium are decided here in the CMS, the running count that
 * decides whether a *metered* article is still free for this reader lives
 * in Postgres and is checked server-side by apps/api's /metering route.
 */
export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "section", "accessTier", "_status", "publishedAt"],
  },
  versions: {
    drafts: {
      autosave: { interval: 1000 },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  access: {
    // Published articles are public; drafts/scheduled are editor-only.
    read: ({ req }) => {
      if (req.user) return true;
      return { _status: { equals: "published" } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) =>
      req.user?.role === "admin" || req.user?.role === "editor",
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar" },
    },
    {
      name: "dek",
      type: "textarea",
      admin: { description: "One-sentence summary shown in listings." },
    },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "body", type: "richText", required: true },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "section",
      type: "relationship",
      relationTo: "sections",
      required: true,
    },
    { name: "tags", type: "relationship", relationTo: "tags", hasMany: true },
    {
      name: "accessTier",
      type: "select",
      required: true,
      defaultValue: "free",
      options: [
        { label: "Free", value: "free" },
        { label: "Metered (counts toward free quota)", value: "metered" },
        { label: "Premium (subscribers only)", value: "premium" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "readingMinutes",
      type: "number",
      admin: {
        position: "sidebar",
        description: "Estimate at ~200wpm; editable.",
      },
    },
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
  ],
};
