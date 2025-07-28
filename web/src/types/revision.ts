import { z } from 'zod';

export const revisionSchema = z.object({
  id: z.string().min(1, { message: 'ID is required' }).uuid({ message: 'ID must be a valid UUID' }),
  applicationId: z.string().min(1, { message: 'Application ID is required' }).uuid({ message: 'Application ID must be a valid UUID' }),
  environmentId: z.string().min(1, { message: 'Environment ID is required' }).uuid({ message: 'Environment ID must be a valid UUID' }),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }),
});

export const createRevisionResponseSchema = z.object({
  revision: revisionSchema,
});

export const revisionArraySchema = z.array(revisionSchema);

export type Revision = z.infer<typeof revisionSchema>;
export type CreateRevisionResponse = z.infer<typeof createRevisionResponseSchema>;
