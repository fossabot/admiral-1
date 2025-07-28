import { z } from 'zod';

export const clusterSchema = z.object({
  id: z.string().min(1, { message: 'ID is required' }).uuid({ message: 'ID must be a valid UUID' }),
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must be 255 characters or less' })
    .regex(/^[a-z0-9]([-_a-z0-9]*[a-z0-9])?$/, {
      message: 'Name must be lowercase alphanumeric with optional hyphens or underscores',
    }),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }),
});

export const clusterArraySchema = z.array(clusterSchema);

export const listClustersSchema = z.object({
  clusters: clusterArraySchema,
  nextPageToken: z.string().optional(),
});

export type Cluster = z.infer<typeof clusterSchema>;
export type ClusterList = z.infer<typeof clusterArraySchema>;
export type ListClustersResponse = z.infer<typeof listClustersSchema>;
