import { BaseService } from '@/services/base';
import { Variable, variableSchema, listVariablesSchema } from '@/types/variable';

export interface CreateOptions {
  key: string;
  value: string;
  description?: string;
  isSensitive: boolean;
}

export interface UpdateOptions {
  variable: {
    key: string;
    value: string;
    description?: string;
    isSensitive: boolean;
  };
}

export class VariableService extends BaseService<Variable, CreateOptions, UpdateOptions> {
  constructor() {
    super('/api/v1/variables', variableSchema, listVariablesSchema, 'variable', 'variables');
  }
}
