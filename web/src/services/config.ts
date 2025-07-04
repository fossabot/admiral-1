import { type Config, configSchema } from '@/types/config';

export class ConfigService {
  public async get(): Promise<Config> {
    return configSchema.parse({});
  }
}
