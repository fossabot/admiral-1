import { z } from 'zod';

export const variableSchema = z.object({
  id: z.string().min(1, { message: 'ID is required' }).uuid({ message: 'ID must be a valid UUID' }),
  applicationId: z
    .string()
    .min(1, { message: 'Application ID is required' })
    .uuid({ message: 'Application ID must be a valid UUID' })
    .optional(),
  environmentId: z
    .string()
    .min(1, { message: 'Environment ID is required' })
    .uuid({ message: 'Environment ID must be a valid UUID' })
    .optional(),
  key: z
    .string()
    .min(1, { message: 'Key is required' })
    .max(255, { message: 'Key must be 255 characters or less' })
    .regex(/^[a-zA-Z0-9_]([-a-zA-Z0-9_]*[a-zA-Z0-9_])?$/, {
      message: 'Key must contain only alphanumeric characters, underscores, and hyphens',
    }),
  value: z.string().min(1, { message: 'Value is required' }),
  description: z.string().max(1000, { message: 'Description must be 1000 characters or less' }).nullable().optional(),
  isSensitive: z.boolean({ message: 'Sensitive must be a boolean' }),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }).optional(),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }).optional(),
});

export const variableArraySchema = z.array(variableSchema);

export const listVariablesSchema = z.object({
  variables: variableArraySchema,
  nextPageToken: z.string().optional(),
});

export type Variable = z.infer<typeof variableSchema>;
export type VariableList = z.infer<typeof variableArraySchema>;
export type ListVariablesResponse = z.infer<typeof listVariablesSchema>;
