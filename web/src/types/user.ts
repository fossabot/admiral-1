import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false).optional(),
  name: z.string().optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  pictureUrl: z.string().url().optional(),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }).optional(),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }).optional(),
});

export const userArraySchema = z.array(userSchema);

export const listUsersSchema = z.object({
  users: userArraySchema,
  nextPageToken: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UserList = z.infer<typeof userArraySchema>;
export type ListUsersResponse = z.infer<typeof listUsersSchema>;
