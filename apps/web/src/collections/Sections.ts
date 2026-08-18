import type { CollectionConfig } from "payload";

export const Sections: CollectionConfig = {
  slug: "sections",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "sortOrder"],
  },
  access: { read: () => true },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar" },
    },
    { name: "description", type: "textarea" },
    { name: "sortOrder", type: "number", defaultValue: 0 },
  ],
};
