import client from '@/services/client';
import { BaseService } from '@/services/base';
import { Manifest, manifestSchema, listManifestsSchema, ManifestFile } from '@/types/manifest';

export interface CreateOptions {
  applicationId: string;
  versionGroupId: string;
  name: string;
  description?: string;
  file?: ManifestFile;
}

export interface UpdateOptions {
  applicationId: string;
  name?: string;
  description?: string;
  fileContent?: Uint8Array;
}

export class ManifestService extends BaseService<Manifest, CreateOptions, UpdateOptions> {
  constructor() {
    super('/api/v1/manifests', manifestSchema, listManifestsSchema, 'manifest', 'manifests');
  }

  // Override update method to use version_group_id instead of manifest id
  public async update(versionGroupId: string, options: UpdateOptions): Promise<Manifest> {
    try {
      const requestBody: Record<string, unknown> = {
        application_id: options.applicationId,
      };

      if (options.name !== undefined) {
        requestBody.name = options.name;
      }
      if (options.description !== undefined) {
        requestBody.description = options.description;
      }
      if (options.fileContent !== undefined) {
        requestBody.file_content = options.fileContent;
      }

      const res = await client.put(`/api/v1/manifests/${versionGroupId}`, requestBody);

      const result = manifestSchema.safeParse(res.data.manifest);
      if (!result.success) {
        console.error('Validation error:', result.error.issues);
        throw new Error('Received invalid manifest data from the API after update.');
      }

      return result.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: { message?: string } } };
        const { status, data } = axiosError.response;
        if (status === 404) {
          throw new Error('Manifest not found');
        }
        if (status === 400) {
          throw new Error(data.message || 'Invalid request');
        }
        if (data.message) {
          throw new Error(`Failed to update manifest: ${data.message}`);
        }
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update manifest: ${errorMessage}`);
    }
  }

  // Override delete method to use version_group_id instead of manifest id
  public async delete(versionGroupId: string): Promise<void> {
    try {
      await client.delete(`/api/v1/manifests/${versionGroupId}`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: { message?: string } } };
        const { status, data } = axiosError.response;
        if (status === 404) {
          throw new Error('Manifest not found');
        }
        if (data.message) {
          throw new Error(`Failed to delete manifest: ${data.message}`);
        }
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete manifest: ${errorMessage}`);
    }
  }
}
