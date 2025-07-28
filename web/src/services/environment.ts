import { BaseService } from '@/services/base';
import { Environment, environmentSchema, listEnvironmentsSchema } from '@/types/environment';

export interface CreateOptions {
  applicationId: string;
  name: string;
  clusterId?: string;
  namespace?: string;
}

export interface UpdateOptions {
  environment: {
    applicationId: string;
    name: string;
    clusterId?: string;
    namespace?: string;
  };
}

export class EnvironmentService extends BaseService<Environment, CreateOptions, UpdateOptions> {
  constructor() {
    super('/api/v1/environments', environmentSchema, listEnvironmentsSchema, 'environment', 'environments');
  }
}
