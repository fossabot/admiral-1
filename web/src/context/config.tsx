import { createContext, useState, type ReactNode, useEffect, ReactElement, useMemo } from 'react';

import { type Config } from '@/types/config';
import { config as defaultConfig } from '@/constant';
import { services } from '@/services';

const Config = createContext<Config>(defaultConfig);

interface ConfigProviderProps {
  children: ReactNode;
}

function ConfigProvider({ children }: ConfigProviderProps): ReactElement {
  const [config, setConfig] = useState<Config>(defaultConfig);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const fetchedConfig: Config = await services.config.get();
        setConfig({ ...defaultConfig, ...fetchedConfig });
      } catch (err) {
        console.warn('Failed to fetch config, using default:', err);
      }
    };

    void fetchData();
  }, []);

  const contextValue = useMemo(() => config, [config]);

  return <Config.Provider value={contextValue}>{children}</Config.Provider>;
}

export { ConfigProvider, Config };
