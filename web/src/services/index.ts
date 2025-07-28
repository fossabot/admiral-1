import { ApplicationService } from '@/services/application';
import { ClusterService } from '@/services/cluster';
import { ConfigService } from '@/services/config';
import { EnvironmentService } from '@/services/environment';
import { ManifestService } from '@/services/manifest';
import { RevisionService } from '@/services/revision';
import { UserService } from '@/services/user';
import { VariableService } from '@/services/variable';

export interface Services {
  application: ApplicationService;
  cluster: ClusterService;
  config: ConfigService;
  environment: EnvironmentService;
  manifest: ManifestService;
  revision: RevisionService;
  user: UserService;
  variable: VariableService;
}

export const services: Services = {
  application: new ApplicationService(),
  cluster: new ClusterService(),
  config: new ConfigService(),
  environment: new EnvironmentService(),
  manifest: new ManifestService(),
  revision: new RevisionService(),
  user: new UserService(),
  variable: new VariableService(),
};
