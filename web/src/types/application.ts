import { z } from 'zod';

export const applicationSchema = z.object({
  id: z.string().min(1, { message: "ID is required" }).uuid({ message: "ID must be a valid UUID" }),
  name: z.string().min(1, { message: "Name is required" }).max(255, { message: "Name must be 255 characters or less" }).regex(/^[a-zA-Z0-9\s-]+$/, {
    message: "Name must contain only alphanumeric characters, spaces, or hyphens",
  }),
  description: z.string().max(1000, { message: "Description must be 1000 characters or less" }).optional(),
  createdAt: z.string().datetime({ message: "Created at must be a valid ISO 8601 date" }).optional(),
  updatedAt: z.string().datetime({ message: "Updated at must be a valid ISO 8601 date" }).optional(),
});

export const applicationArraySchema = z.array(applicationSchema);

export const listApplicationsSchema = z.object({
  applications: applicationArraySchema,
  nextPageToken: z.string().optional(),
});

export type Application = z.infer<typeof applicationSchema>;
export type ApplicationList = z.infer<typeof applicationArraySchema>;
export type ListApplicationsResponse = z.infer<typeof listApplicationsSchema>;