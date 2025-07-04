import { BaseService } from '@/services/base';
import { Cluster, clusterSchema, listClustersSchema } from '@/types/cluster';

export interface ClusterCreateOptions {
  name: string;
}

export interface ClusterUpdateOptions {
  name: string;
}

export class ClusterService extends BaseService<
  Cluster,
  ClusterCreateOptions,
  ClusterUpdateOptions
> {
  constructor() {
    super(
      '/api/v1/clusters',
      clusterSchema,
      listClustersSchema,
      'cluster',
      'clusters'
    );
  }
}
