import { type Config, configSchema } from '@/types/config';

// Placeholder: for future fetching configuration settings from the backend for the web client
export class ConfigService {
  public async get(): Promise<Config> {
    return configSchema.parse({});
  }
}
