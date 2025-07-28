import { BaseService } from '@/services/base';
import { Application, applicationSchema, listApplicationsSchema } from '@/types/application';

export interface CreateOptions {
  name: string;
  description?: string;
}

export interface UpdateOptions {
  application: {
    name: string;
    description?: string;
  };
}

export class ApplicationService extends BaseService<Application, CreateOptions, UpdateOptions> {
  constructor() {
    super('/api/v1/applications', applicationSchema, listApplicationsSchema, 'application', 'applications');
  }
}
