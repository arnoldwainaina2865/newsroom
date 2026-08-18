import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role"],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req, id }) =>
      req.user?.id === id || req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "reader",
      options: [
        { label: "Reader", value: "reader" },
        { label: "Writer", value: "writer" },
        { label: "Editor", value: "editor" },
        { label: "Admin", value: "admin" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "avatar", type: "upload", relationTo: "media" },
  ],
};
