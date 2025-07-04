import client from '@/services/client';
import { Environment, environmentArraySchema, environmentSchema } from '@/types/environment';

interface ListOptions {
  name?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export class EnvironmentService {
  public async create(name: string): Promise<Environment> {
    const res = await client.post('/api/v1/environments', { name });
    const result = environmentSchema.safeParse(res.data);
    if (!result.success) {
      console.error('Validation error:', result.error.errors);
      throw new Error('Received invalid environment data from the API after creation.');
    }

    return result.data;
  }

  public async get(id: string): Promise<Environment> {
    const res = await client.get(`/api/v1/environments/${id}`);
    const result = environmentSchema.safeParse(res.data.environment);
    if (!result.success) {
      console.error('Validation error:', result.error.errors);
      throw new Error('Received invalid environment data from the API.');
    }

    return result.data;
  }

  public async list(options: ListOptions = {}): Promise<Environment[]> {
    const params: {
      name?: string;
      page?: number;
      perPage?: number;
      sortBy?: 'name' | 'date';
      sortOrder?: 'asc' | 'desc';
    } = {};

    if (options.name !== undefined) params.name = options.name;

    const res = await client.get('/api/v1/environments', { params });
    const result = environmentArraySchema.safeParse(res.data.applications);
    if (!result.success) {
      console.error('Validation error:', result.error.errors);
      throw new Error('Received invalid environment list data from the API.');
    }

    return result.data;
  }
}
