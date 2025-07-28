import client from '@/services/client';
import { BaseService } from '@/services/base';
import { User, userSchema, listUsersSchema } from '@/types/user';

export interface CreateOptions {
  email: string;
  emailVerified: boolean;
  name?: string | undefined;
  givenName?: string | undefined;
  familyName?: string | undefined;
  pictureUrl?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface UpdateOptions {
  email: string;
  emailVerified: boolean;
  name?: string | undefined;
  givenName?: string | undefined;
  familyName?: string | undefined;
  pictureUrl?: string | undefined;
}

export class UserService extends BaseService<User, CreateOptions, UpdateOptions> {
  constructor() {
    super('/api/v1/users', userSchema, listUsersSchema, 'user', 'users');
  }

  public async me(): Promise<User> {
    try {
      const res = await client.get('/api/v1/user');
      if (!res.data || typeof res.data !== 'object') {
        throw new Error('Invalid API response: missing or invalid data object');
      }

      const userData = res.data.user || res.data;

      const result = userSchema.safeParse(userData);
      if (!result.success) {
        const validationErrors = result.error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');

        throw new Error(`User data validation failed: ${validationErrors}`);
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to fetch user profile: Network or server error');
      }
    }
  }
}
