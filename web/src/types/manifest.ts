import { z } from 'zod';

const manifestFileSchema = z.object({
  fileContent: z
    .instanceof(Uint8Array)
    .refine((data) => data.length >= 1 && data.length <= 10_485_760, { message: 'File content must be between 1 and 10,485,760 bytes' }),
  checksumType: z.literal('sha256'),
  checksum: z
    .string()
    .min(32, { message: 'Checksum must be at least 32 characters' })
    .max(64, {
      message: 'Checksum must be 64 characters or less',
    })
    .regex(/^[0-9a-fA-F]+$/, { message: 'Checksum must be a hexadecimal string' }),
});

export const manifestSchema = z.object({
  id: z.string().uuid({ message: 'ID must be a valid UUID' }),
  applicationId: z.string().uuid({ message: 'Application ID must be a valid UUID' }),
  versionGroupId: z.string().uuid({ message: 'Version group ID must be a valid UUID' }),
  name: z.string().min(1, { message: 'Name is required' }).max(255, { message: 'Name must be 255 characters or less' }),
  description: z.string().max(1024, { message: 'Description must be 1024 characters or less' }).nullable().optional(),
  file: manifestFileSchema.optional(),
  version: z.number().int({ message: 'Version must be an integer' }).min(0, { message: 'Version must be 0 or greater' }),
  isLatest: z.boolean(),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }),
});

export const manifestArraySchema = z.array(manifestSchema);

export const listManifestsSchema = z.object({
  manifests: manifestArraySchema,
  nextPageToken: z.string().optional(),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestFile = z.infer<typeof manifestFileSchema>;
export type ManifestList = z.infer<typeof manifestArraySchema>;
export type ListManifestsResponse = z.infer<typeof listManifestsSchema>;
