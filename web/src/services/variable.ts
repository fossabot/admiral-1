import { BaseService } from '@/services/base';
import { Variable, variableSchema, listVariablesSchema } from '@/types/variable';

export interface VariableCreateOptions {
  key: string;
  value: string;
  description?: string;
  isSensitive: boolean;
}

export interface VariableUpdateOptions {
  variable: {
    key: string;
    value: string;
    description?: string;
    isSensitive: boolean;
  }
}

export class VariableService extends BaseService<
  Variable,
  VariableCreateOptions,
  VariableUpdateOptions
> {
  constructor() {
    super(
      '/api/v1/variables',
      variableSchema,
      listVariablesSchema,
      'variable',
      'variables'
    );
  }
}
