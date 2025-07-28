import React, { ReactElement, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Card, CircularProgress, Stack, Typography, Button, Box } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { services } from '@/services';
import { setUser } from '@/store/slices/user';
import { isAdmiralError } from '@/services/client';

interface FallbackComponentProps {
  errorMessage: string;
}

function FallbackComponent({ errorMessage }: FallbackComponentProps): ReactElement {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f5f7fa 0%, #e4e7eb 100%)', // Subtle gradient background
      }}
    >
      <Card
        elevation={6}
        sx={{
          maxWidth: 450,
          width: '100%',
          margin: '1.5rem',
          padding: '2.5rem',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)', // Softer shadow for depth
        }}
      >
        <Stack spacing={2} alignItems="center">
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
          <Typography variant="h5" component="h1" fontWeight="bold" color="text.primary" textAlign="center">
            Something Went Wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6 }}>
            {errorMessage ||
              'We encountered an issue. Please try again later or contact support if the problem persists.'}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{
                textTransform: 'none',
                padding: '0.5rem 2rem',
                borderRadius: '8px',
              }}
            >
              Try Again
            </Button>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}

interface AuthGuardProps {
  children: React.ReactElement;
}

const AuthGuard = ({ children }: AuthGuardProps): ReactElement => {
  const dispatch = useDispatch();
  const [isLoading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const user = await services.user.me();
        dispatch(setUser(user));
      } catch (error: unknown) {
        // Display the fallback component unless the error is a 401 Unauthorized
        if (isAdmiralError(error) && error?.status?.code !== 401) {
          setErrorMessage('Failed to retrieve user information. Please try again later.');
        }
        // For 401 errors, the client interceptor will handle redirect to login
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [dispatch]);

  if (isLoading) {
    return (
      <Stack direction="row" justifyContent="center" alignItems="center" sx={{ height: '100vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (errorMessage) {
    return <FallbackComponent errorMessage={errorMessage} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
