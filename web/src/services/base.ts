import { z } from 'zod';

import client from '@/services/client';

export interface BaseListOptions {
  filter?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface BaseListResponse<T> {
  items: T[];
  nextPageToken?: string;
}

export abstract class BaseService<TModel, TCreateOptions, TUpdateOptions, TListOptions extends BaseListOptions = BaseListOptions> {
  protected constructor(
    protected readonly basePath: string,
    protected readonly itemSchema: z.ZodType<TModel>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly listSchema: z.ZodType<any>,
    protected readonly itemResponseKey: string = 'item',
    protected readonly listResponseKey: string = 'items',
  ) {}

  public async create(options: TCreateOptions): Promise<TModel> {
    try {
      const res = await client.post(this.basePath, options);
      const result = this.itemSchema.safeParse(res.data[this.itemResponseKey]);

      if (!result.success) {
        console.error('Validation error:', result.error.issues);
        throw new Error(`Received invalid ${this.itemResponseKey} data from the API after creation.`);
      }

      return result.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create ${this.itemResponseKey}`);
    }
  }

  public async get(id: string): Promise<TModel> {
    try {
      const res = await client.get(`${this.basePath}/${id}`);
      const result = this.itemSchema.safeParse(res.data[this.itemResponseKey]);

      if (!result.success) {
        console.error('Validation error:', result.error.issues);
        throw new Error(`Received invalid ${this.itemResponseKey} data from the API.`);
      }

      return result.data;
    } catch (error) {
      throw this.handleError(error, `Failed to retrieve ${this.itemResponseKey}`);
    }
  }

  public async list(options?: TListOptions): Promise<BaseListResponse<TModel>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: Record<string, any> = {};

      if (options?.filter) params.filter = options.filter;
      if (options?.pageSize) params.pageSize = options.pageSize;
      if (options?.pageToken) params.pageToken = options.pageToken;

      const res = await client.get(this.basePath, { params });
      const result = this.listSchema.safeParse(res.data);

      if (!result.success) {
        console.error('Validation error:', result.error.issues);
        throw new Error(`Received invalid ${this.listResponseKey} list data from the API.`);
      }

      return {
        items: result.data[this.listResponseKey],
        nextPageToken: result.data.nextPageToken,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to list ${this.listResponseKey}`);
    }
  }

  public async update(id: string, options: TUpdateOptions): Promise<TModel> {
    try {
      const res = await client.put(`${this.basePath}/${id}`, options);
      const result = this.itemSchema.safeParse(res.data[this.itemResponseKey]);

      if (!result.success) {
        console.error('Validation error:', result.error.issues);
        throw new Error(`Received invalid ${this.itemResponseKey} data from the API after update.`);
      }

      return result.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update ${this.itemResponseKey}`);
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await client.delete(`${this.basePath}/${id}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete ${this.itemResponseKey}`);
    }
  }

  protected handleError(error: unknown, defaultMessage: string): Error {
    if (error && typeof error === 'object') {
      if ('response' in error && error.response && typeof error.response === 'object') {
        const response = error.response;

        if ('status' in response && typeof response.status === 'number') {
          if (response.status === 404) {
            return new Error(`${this.itemResponseKey} not found`);
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
