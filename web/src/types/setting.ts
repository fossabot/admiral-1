import { z } from 'zod';

export const settingSchema = z.object({
  id: z.string().min(1, { message: 'ID is required' }).uuid({ message: 'ID must be a valid UUID' }),
  applicationId: z.string().uuid({ message: 'Application ID must be a valid UUID' }).optional(),
  environmentId: z.string().uuid({ message: 'Environment ID must be a valid UUID' }).optional(),
  key: z
    .string()
    .min(1, { message: 'Key is required' })
    .max(255, { message: 'Key must be 255 characters or less' })
    .regex(/^[a-zA-Z0-9_]([-a-zA-Z0-9_]*[a-zA-Z0-9_])?$/, {
      message: 'Key must be alphanumeric or underscores, with optional hyphens, and start/end with alphanumeric or underscore',
    }),
  value: z.string().min(1, { message: 'Value is required' }).max(1000, { message: 'Value must be 1000 characters or less' }),
  isSensitive: z.boolean({ message: 'isSensitive must be a boolean' }),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }).optional(),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }).optional(),
});

export const settingArraySchema = z.array(settingSchema);
export type Setting = z.infer<typeof settingSchema>;
