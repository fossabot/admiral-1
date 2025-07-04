import client from '@/services/client';
import { Application, listApplicationsSchema, applicationSchema } from '@/types/application';

export interface ListOptions {
  filter?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface CreateOptions {
  name: string;
  description?: string;
}

export interface UpdateOptions {
  id: string;
  name: string;
  description?: string;
}

export class ApplicationService {
  public async create(options: CreateOptions): Promise<Application> {
    try {
      const res = await client.post('/api/v1/applications', {
        name: options.name,
        description: options.description,
      });
      const result = applicationSchema.safeParse(res.data.application);

      if (!result.success) {
        console.error('Validation error:', result.error.errors);
        throw new Error('Received invalid application data from the API after creation.');
      }

      return result.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create application');
    }
  }

  public async get(id: string): Promise<Application> {
    try {
      const res = await client.get(`/api/v1/applications/${id}`);
      const result = applicationSchema.safeParse(res.data.application);

      if (!result.success) {
        console.error('Validation error:', result.error.errors);
        throw new Error('Received invalid application data from the API.');
      }

      return result.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to retrieve application');
    }
  }

  public async list(options?: ListOptions): Promise<{
    applications: Application[];
    nextPageToken?: string;
  }> {
    try {
      const params: {
        filter?: string;
        page_size?: number;
        page_token?: string;
      } = {};

      if (options?.filter) params.filter = options.filter;
      if (options?.pageSize) params.page_size = options.pageSize;
      if (options?.pageToken) params.page_token = options.pageToken;

      const res = await client.get('/api/v1/applications', { params });
      const result = listApplicationsSchema.safeParse(res.data);

      if (!result.success) {
        console.error('Validation error:', result.error.errors);
        throw new Error('Received invalid application list data from the API.');
      }

      return {
        applications: result.data.applications,
        nextPageToken: result.data.nextPageToken,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to list applications');
    }
  }

  public async update(options: UpdateOptions): Promise<Application> {
    try {
      const res = await client.put(`/api/v1/applications/${options.id}`, {
        application: {
          id: options.id,
          name: options.name,
          description: options.description,
        },
      });
      const result = applicationSchema.safeParse(res.data.application);

      if (!result.success) {
        console.error('Validation error:', result.error.errors);
        throw new Error('Received invalid application data from the API after update.');
      }

      return result.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update application');
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await client.delete(`/api/v1/applications/${id}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete application');
    }
  }

  private handleError(error: any, defaultMessage: string): Error {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 404) {
        return new Error('Application not found');
      }
      if (status === 400) {
        return new Error(data.message || 'Invalid request');
      }
      if (data.message) {
        return new Error(`${defaultMessage}: ${data.message}`);
      }
    }
    return new Error(`${defaultMessage}: ${error.message || 'Unknown error'}`);
  }
}
