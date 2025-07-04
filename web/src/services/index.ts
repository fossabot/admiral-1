import { ApplicationService } from '@/services/application';
import { ClusterService } from '@/services/cluster';
import { ConfigService } from '@/services/config';
import { EnvironmentService } from '@/services/environment';
import { UserService } from '@/services/user';
import { VariableService } from '@/services/variable';

export interface Services {
  application: ApplicationService;
  cluster: ClusterService;
  config: ConfigService;
  environment: EnvironmentService;
  user: UserService;
  variable: VariableService;
}

export const services: Services = {
  application: new ApplicationService(),
  cluster: new ClusterService(),
  config: new ConfigService(),
  environment: new EnvironmentService(),
  user: new UserService(),
  variable: new VariableService(),
};
