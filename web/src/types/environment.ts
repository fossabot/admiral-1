import { z } from 'zod';

export const environmentSchema = z.object({
  id: z.string().min(1, { message: 'ID is required' }).uuid({ message: 'ID must be a valid UUID' }),
  application_id: z.string().min(1, { message: 'Application ID is required' }).uuid({ message: 'Application ID must be a valid UUID' }),
  cluster_id: z.string().uuid({ message: 'Cluster ID must be a valid UUID' }).optional(),
  name: z.string().min(1, { message: 'Name is required' }).max(255, { message: 'Name must be 255 characters or less' }),
  namespace: z
    .string()
    .max(63, { message: 'Namespace must be 63 characters or less' })
    .regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, {
      message: 'Namespace must be lowercase alphanumeric with optional hyphens',
    })
    .optional(),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }).optional(),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }).optional(),
});
export const environmentArraySchema = z.array(environmentSchema);
export type Environment = z.infer<typeof environmentSchema>;
