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
    let isMounted = true;

    const fetchData = async (): Promise<void> => {
      try {
        const fetchedConfig: Config = await services.config.get();
        if (isMounted) {
          setConfig({ ...defaultConfig, ...fetchedConfig });
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to fetch config, using default:', err);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const contextValue = useMemo(() => config, [config]);

  return <Config.Provider value={contextValue}>{children}</Config.Provider>;
}

export { ConfigProvider, Config };
