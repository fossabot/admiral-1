import client from '@/services/client';
import { Revision, createRevisionResponseSchema } from '@/types/revision';

export interface CreateOptions {
  applicationId: string;
  environmentId: string;
}

export class RevisionService {
  private readonly basePath = '/api/v1/revisions';

  public async create(options: CreateOptions): Promise<Revision> {
    try {
      const res = await client.post(this.basePath, options);
      const result = createRevisionResponseSchema.safeParse(res.data);

      if (!result.success) {
        console.error('Validation error:', result.error.issues);
        throw new Error('Received invalid revision data from the API after creation.');
      }

      return result.data.revision;
    } catch (error) {
      throw this.handleError(error, 'Failed to create revision');
    }
  }

  private handleError(error: unknown, defaultMessage: string): Error {
    if (error && typeof error === 'object') {
      if ('response' in error && error.response && typeof error.response === 'object') {
        const response = error.response;

        if ('status' in response && typeof response.status === 'number') {
          if (response.status === 404) {
            return new Error('Revision not found');
          }

          if (response.status === 400 && 'data' in response && response.data) {
            if (typeof response.data === 'object' && 'message' in response.data) {
              const message = typeof response.data.message === 'string' ? response.data.message : 'Invalid request';
              return new Error(message);
            }
            return new Error('Invalid request');
          }

          if (
            'data' in response &&
            response.data &&
            typeof response.data === 'object' &&
            'message' in response.data &&
            typeof response.data.message === 'string'
          ) {
            return new Error(`${defaultMessage}: ${response.data.message}`);
          }
        }
      }

      if ('message' in error && typeof error.message === 'string') {
        return new Error(`${defaultMessage}: ${error.message}`);
      }
    }

    return new Error(`${defaultMessage}: Unknown error`);
  }
}
