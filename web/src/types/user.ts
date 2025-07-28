import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid({ message: 'ID must be a valid UUID' }),
  email: z.string().email(),
  emailVerified: z.boolean().default(false).optional(),
  name: z
    .string()
    .min(1, { message: 'Name must be at least 1 character' })
    .max(255, { message: 'Name must be 255 characters or less' })
    .optional(),
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
