import { Suspense, memo, type ComponentType, type ReactElement } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import Loader from '@/components/Loader';
import { Alert, Box } from '@mui/material';

interface LoadableProps {
  fallback?: NonNullable<React.ReactNode>;
}

function Loadable<P extends object>(Component: ComponentType<P>) {
  function LoadableComponent(props: P & LoadableProps): ReactElement {
    const { fallback = <Loader />, ...restProps } = props;

    const componentProps = restProps as P;
    const requiredProps = Object.entries(componentProps).filter(([_, value]) => value === undefined);

    if (requiredProps.length > 0) {
      throw new Error(
        `Missing required props for ${Component.displayName || Component.name}: ${requiredProps
          .map(([key]) => key)
          .join(', ')}`,
      );
    }

    return (
      <ErrorBoundary
        fallback={
          <Box sx={{ p: 2 }}>
            <Alert severity="error">Error loading component.</Alert>
          </Box>
        }
        onError={(error) => {
          console.error('Error loading component:', error);
        }}
      >
        <Suspense fallback={fallback}>
          <Component {...componentProps} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  LoadableComponent.displayName = `Loadable(${Component.displayName || Component.name || 'Component'})`;

  return memo(LoadableComponent, (prevProps, nextProps) => {
    const prevEntries = Object.entries(prevProps);
    const nextEntries = Object.entries(nextProps);

    if (prevEntries.length !== nextEntries.length) {
      return false;
    }

    return prevEntries.every(([key, value]) => {
      return Object.is(value, nextProps[key as keyof typeof nextProps]);
    });
  });
}

export default Loadable;
