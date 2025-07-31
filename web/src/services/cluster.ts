import client, { isAdmiralError } from '@/services/client';
import { BaseService } from '@/services/base';
import { Cluster, clusterSchema, listClustersSchema } from '@/types/cluster';

export interface CreateOptions {
  name: string;
  metadata?: Record<string, string>;
}

export interface UpdateOptions {
  cluster: {
    name: string;
    metadata?: Record<string, string>;
  };
}

export interface RegisterOptions {
  clusterIdentifier: string;
  metadata?: Record<string, string>;
}

export interface RegisterResponse {
  cluster: Cluster;
  accessToken: string;
}

export interface CreateResponse {
  cluster: Cluster;
  accessToken: string;
}

export class ClusterService extends BaseService<Cluster, CreateOptions, UpdateOptions> {
  constructor() {
    super('/api/v1/clusters', clusterSchema, listClustersSchema, 'cluster', 'clusters');
  }

  /**
   * Note: The inherited create() method returns only the Cluster object.
   * For cluster creation, you likely want createWithToken() which returns
   * both the cluster and the access token needed for cluster authentication.
   */
  public async resetToken(clusterId: string): Promise<string> {
    try {
      const res = await client.post(`/api/v1/clusters/${clusterId}/reset-token`);

      if (!res.data.accessToken || typeof res.data.accessToken !== 'string') {
        throw new Error('Invalid or missing access token in reset response.');
      }

      return res.data.accessToken;
    } catch (error: unknown) {
      console.error('Cluster token reset error:', error);

      if (isAdmiralError(error)) {
        const { status, message } = error;
        if (status.code === 404) {
          throw new Error('Cluster not found');
        }
        throw new Error(`Failed to reset cluster token: ${message}`);
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to reset cluster token: Unknown error');
    }
  }

  public async createWithToken(options: CreateOptions): Promise<CreateResponse> {
    try {
      const res = await client.post(this.basePath, options);

      // Validate cluster data
      const clusterResult = clusterSchema.safeParse(res.data.cluster);
      if (!clusterResult.success) {
        console.error('Validation error:', clusterResult.error.issues);
        throw new Error('Received invalid cluster data from the API after creation.');
      }

      // Validate access token
      if (!res.data.accessToken || typeof res.data.accessToken !== 'string') {
        throw new Error('Invalid or missing access token in creation response.');
      }

      return {
        cluster: clusterResult.data,
        accessToken: res.data.accessToken,
      };
    } catch (error: unknown) {
      console.error('Cluster creation error caught:', error);

      // Handle Admiral client errors
      if (isAdmiralError(error)) {
        const { status, message } = error;
        if (status.code === 400) {
          throw new Error(message || 'Invalid creation request');
        }
        if (status.code === 409) {
          throw new Error('Cluster with this name already exists');
        }
        throw new Error(`Failed to create cluster: ${message}`);
      }

      // Handle standard errors
      if (error instanceof Error) {
        throw error;
      }

      console.error('Unknown error type:', typeof error, error);
      throw new Error('Failed to create cluster: Unknown error');
    }
  }

  public async register(options: RegisterOptions): Promise<RegisterResponse> {
    try {
      const res = await client.post('/api/v1/clusters/register', {
        cluster_identifier: options.clusterIdentifier,
        metadata: options.metadata,
      });

      // Validate cluster data
      const clusterResult = clusterSchema.safeParse(res.data.cluster);
      if (!clusterResult.success) {
        console.error('Validation error:', clusterResult.error.issues);
        throw new Error('Received invalid cluster data from the API after registration.');
      }

      // Validate access token
      if (!res.data.accessToken || typeof res.data.accessToken !== 'string') {
        throw new Error('Invalid or missing access token in registration response.');
      }

      return {
        cluster: clusterResult.data,
        accessToken: res.data.accessToken,
      };
    } catch (error: unknown) {
      console.error('Cluster registration error caught:', error);

      // Handle Admiral client errors
      if (isAdmiralError(error)) {
        const { status, message } = error;
        if (status.code === 400) {
          throw new Error(message || 'Invalid registration request');
        }
        if (status.code === 409) {
          throw new Error('Cluster with this identifier already exists');
        }
        throw new Error(`Failed to register cluster: ${message}`);
      }

      // Handle standard errors
      if (error instanceof Error) {
        throw error;
      }

      console.error('Unknown error type:', typeof error, error);
      throw new Error('Failed to register cluster: Unknown error');
    }
  }
}
