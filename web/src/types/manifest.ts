import { z } from 'zod';

const manifestFileSchema = z.object({
  file_content: z
    .instanceof(Uint8Array)
    .refine((data) => data.length >= 1 && data.length <= 10_485_760, { message: 'File content must be between 1 and 10,485,760 bytes' }),
  checksum_type: z
    .string()
    .min(1, { message: 'Checksum type is required' })
    .max(50, {
      message: 'Checksum type must be 50 characters or less',
    })
    .refine((val) => val === 'sha256', { message: "Checksum type must be 'sha256'" }),
  checksum: z
    .string()
    .min(32, { message: 'Checksum must be at least 32 characters' })
    .max(64, {
      message: 'Checksum must be 64 characters or less',
    })
    .regex(/^[0-9a-fA-F]+$/, { message: 'Checksum must be a hexadecimal string' }),
});

export type ManifestFile = z.infer<typeof manifestFileSchema>;

export const manifestSchema = z.object({
  id: z.string().uuid({ message: 'ID must be a valid UUID' }),
  applicationId: z.string().uuid({ message: 'Application ID must be a valid UUID' }),
  versionGroupId: z.string().uuid({ message: 'Version group ID must be a valid UUID' }),
  name: z.string().min(1, { message: 'Name is required' }).max(255, { message: 'Name must be 255 characters or less' }),
  description: z.string().max(1000, { message: 'Description must be 1000 characters or less' }).optional(),
  file: manifestFileSchema.optional(),
  version: z.number().int({ message: 'Version must be an integer' }).positive({ message: 'Version must be positive' }),
  isLatest: z.boolean(),
  createdAt: z.string().datetime({ message: 'Created at must be a valid ISO 8601 date' }).optional(),
  updatedAt: z.string().datetime({ message: 'Updated at must be a valid ISO 8601 date' }).optional(),
});

export const manifestArraySchema = z.array(manifestSchema);
export type Manifest = z.infer<typeof manifestSchema>;
