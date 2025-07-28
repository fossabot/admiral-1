import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { Application } from '@/types/application';
import type { Environment } from '@/types/environment';
import type { Variable } from '@/types/variable';
import type { Manifest } from '@/types/manifest';
import type { Revision } from '@/types/revision';

export interface ApplicationDetailsState {
  application: Application | null;
  environments: Environment[];
  variables: Variable[];
  manifests: Manifest[];
  revisions: Revision[];
  selectedEnvironment: Environment | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  realTimeEnabled: boolean;
  lastUpdated: Date | null;
}

export interface ApplicationDetailsActions {
  selectEnvironment: (environment: Environment | null) => void;
  refreshApplication: () => Promise<void>;
  refreshEnvironments: () => Promise<void>;
  refreshVariables: () => Promise<void>;
  refreshManifests: () => Promise<void>;
  refreshRevisions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  toggleRealTime: () => void;
}

export const useApplicationDetails = (): ApplicationDetailsState & ApplicationDetailsActions => {
  const { slug: applicationId } = useParams<{ slug: string }>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('Application ID from URL:', applicationId);

  const [state, setState] = useState<ApplicationDetailsState>({
    application: null,
    environments: [],
    variables: [],
    manifests: [],
    revisions: [],
    selectedEnvironment: null,
    loading: true,
    error: null,
    initialized: false,
    realTimeEnabled: false,
    lastUpdated: null,
  });


  const updateState = useCallback((updates: Partial<ApplicationDetailsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshApplication = useCallback(async () => {
    console.log("refreshApplication")
    if (!applicationId) {
      updateState({ error: 'Application ID is required', loading: false, initialized: true });
      return;
    }

    try {
      updateState({ loading: true, error: null });

      // Mock data for now since services might not be fully implemented
      const mockApplication = {
        id: applicationId,
        name: `Application ${applicationId}`,
        description: 'Mock application for development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      updateState({ application: mockApplication, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load application';
      updateState({ error: errorMessage, loading: false, initialized: true });
      console.error('Failed to fetch application:', error);
    }
  }, [applicationId, updateState]);

  const refreshEnvironments = useCallback(async () => {
    console.log("refreshEnvironments")
    if (!applicationId) return;

    try {
      // Mock environments data
      const mockEnvironments = [
        {
          id: '1',
          name: 'Development',
          namespace: 'dev',
          applicationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Staging',
          namespace: 'staging',
          applicationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Production',
          namespace: 'prod',
          applicationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      updateState({ environments: mockEnvironments });

      // Auto-select first environment if none selected
      const currentSelectedEnv = state.selectedEnvironment;
      if (mockEnvironments.length > 0 && !currentSelectedEnv) {
        updateState({ selectedEnvironment: mockEnvironments[0] });
      }
    } catch (error) {
      console.error('Failed to fetch environments:', error);
    }
  }, [applicationId, updateState]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshVariables = useCallback(async () => {
    if (!applicationId) return;

    try {
      // Mock variables data
      const mockVariables = [
        {
          id: '1',
          key: 'DATABASE_URL',
          value: 'postgresql://localhost:5432/myapp',
          description: 'Database connection string',
          isSensitive: true,
          source: 'application' as const,
          applicationId,
        },
        {
          id: '2',
          key: 'API_KEY',
          value: 'sk-1234567890abcdef',
          description: 'Third-party API key',
          isSensitive: true,
          source: 'environment' as const,
          applicationId,
          environmentId: state.selectedEnvironment?.id,
        },
        {
          id: '3',
          key: 'LOG_LEVEL',
          value: 'info',
          description: 'Application log level',
          isSensitive: false,
          source: 'global' as const,
        },
      ];

      updateState({ variables: mockVariables });
    } catch (error) {
      console.error('Failed to fetch variables:', error);
    }
  }, [applicationId, updateState]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshManifests = useCallback(async () => {
    if (!applicationId) return;

    try {
      // Mock manifests data
      const yamlContent1 = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80`;

      const yamlContent2 = `apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP`;

      const mockManifests = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          applicationId,
          versionGroupId: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Deployment Manifest',
          description: 'Main application deployment',
          version: 1,
          isLatest: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          file: {
            fileContent: new TextEncoder().encode(yamlContent1),
            checksumType: 'sha256' as const,
            checksum: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          },
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          applicationId,
          versionGroupId: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Service Manifest',
          description: 'Service configuration',
          version: 1,
          isLatest: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          file: {
            fileContent: new TextEncoder().encode(yamlContent2),
            checksumType: 'sha256' as const,
            checksum: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          },
        },
      ];

      updateState({ manifests: mockManifests });
    } catch (error) {
      console.error('Failed to fetch manifests:', error);
    }
  }, [applicationId, updateState]);

  const refreshRevisions = useCallback(async () => {
    const currentSelectedEnv = state.selectedEnvironment;
    if (!applicationId) {
      updateState({ revisions: [] });
      return;
    }

    try {
      // Mock revisions data
      const mockRevisions = [
        {
          id: '1',
          version: 'v1.2.3',
          applicationId,
          environmentId: currentSelectedEnv?.id || '1',
          description: 'Added user authentication feature',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          version: 'v1.2.2',
          applicationId,
          environmentId: currentSelectedEnv?.id || '1',
          description: 'Fixed critical security vulnerability',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          version: 'v1.2.1',
          applicationId,
          environmentId: currentSelectedEnv?.id || '1',
          description: 'Performance improvements and bug fixes',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      updateState({ revisions: mockRevisions });
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
    }
  }, [applicationId, updateState]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAll = useCallback(async (isRealTimeUpdate = false) => {
    console.log("refreshAll")
    updateState({ loading: !isRealTimeUpdate, error: null });

    try {
      // First load application and environments
      await refreshApplication();
      await refreshEnvironments();
      await refreshManifests();

      // Small delay to ensure environments are loaded before dependent calls
      await new Promise(resolve => setTimeout(resolve, 50));

      // Then load environment-dependent data
      await refreshVariables();
      await refreshRevisions();

      updateState({ lastUpdated: new Date(), initialized: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      updateState({ error: errorMessage, initialized: true });
    } finally {
      updateState({ loading: false });
    }
  }, [applicationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRealTime = useCallback(() => {
    setState(prev => {
      const newRealTimeEnabled = !prev.realTimeEnabled;

      if (newRealTimeEnabled) {
        // Start polling every 30 seconds
        intervalRef.current = setInterval(() => {
          void refreshAll(true);
        }, 30000);
      } else {
        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      return {
        ...prev,
        realTimeEnabled: newRealTimeEnabled,
      };
    });
  }, [refreshAll]);

  const selectEnvironment = useCallback((environment: Environment | null) => {
    updateState({ selectedEnvironment: environment });

    // Refresh environment-specific data
    if (environment) {
      void refreshVariables();
      void refreshRevisions();
    }
  }, [refreshVariables, refreshRevisions, updateState]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!applicationId || state.initialized) return;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Mock application data
        const mockApplication = {
          id: applicationId,
          name: `Application ${applicationId}`,
          description: 'Mock application for development',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Mock environments data
        const mockEnvironments = [
          {
            id: '1',
            name: 'Development',
            namespace: 'dev',
            applicationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Staging',
            namespace: 'staging',
            applicationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Production',
            namespace: 'prod',
            applicationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        // Mock variables data
        const mockVariables = [
          {
            id: '1',
            key: 'DATABASE_URL',
            value: 'postgresql://localhost:5432/myapp',
            description: 'Database connection string',
            isSensitive: true,
            source: 'application' as const,
            applicationId,
          },
          {
            id: '2',
            key: 'API_KEY',
            value: 'sk-1234567890abcdef',
            description: 'Third-party API key',
            isSensitive: true,
            source: 'environment' as const,
            applicationId,
            environmentId: '1',
          },
          {
            id: '3',
            key: 'LOG_LEVEL',
            value: 'info',
            description: 'Application log level',
            isSensitive: false,
            source: 'global' as const,
          },
        ];

        // Mock manifests data
        const yamlContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80`;

        const mockManifests = [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            applicationId,
            versionGroupId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Deployment Manifest',
            description: 'Main application deployment',
            version: 1,
            isLatest: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            file: {
              fileContent: new TextEncoder().encode(yamlContent),
              checksumType: 'sha256' as const,
              checksum: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
          },
        ];

        // Mock revisions data
        const mockRevisions = [
          {
            id: '1',
            version: 'v1.2.3',
            applicationId,
            environmentId: '1',
            description: 'Added user authentication feature',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            version: 'v1.2.2',
            applicationId,
            environmentId: '1',
            description: 'Fixed critical security vulnerability',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setState(prev => ({
            ...prev,
            application: mockApplication,
            environments: mockEnvironments,
            variables: mockVariables,
            manifests: mockManifests,
            revisions: mockRevisions,
            selectedEnvironment: mockEnvironments[0],
            loading: false,
            initialized: true,
            lastUpdated: new Date(),
          }));
        }
      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
          setState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    void loadInitialData();

    return () => {
      mounted = false;
    };
  }, [applicationId, state.initialized]);

  // Cleanup real-time polling on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    selectEnvironment,
    refreshApplication,
    refreshEnvironments,
    refreshVariables,
    refreshManifests,
    refreshRevisions,
    refreshAll,
    toggleRealTime,
  };
};
