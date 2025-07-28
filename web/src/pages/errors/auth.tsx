import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import {
  Container,
  Card,
  Stack,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import {
  ErrorOutline as ErrorOutlineIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * Predefined list of allowed SSO error types for security.
 * This prevents arbitrary messages from being displayed.
 */
const ALLOWED_SSO_ERRORS = {
  // Token-related errors
  'invalid_token': 'Your session token is invalid. Please try logging in again.',
  'expired_token': 'Your session has expired. Please log in again.',
  'invalid_state': 'Invalid authentication state. This may be due to an expired or tampered session.',
  'missing_token': 'Authentication token is missing. Please try logging in again.',

  // OAuth/OIDC specific errors
  'invalid_grant': 'The authorization grant is invalid or expired. Please try logging in again.',
  'unauthorized_client': 'The client is not authorized to perform this action.',
  'access_denied': 'Access was denied during the authentication process.',
  'invalid_request': 'The authentication request was invalid or malformed.',
  'invalid_scope': 'The requested scope is invalid or malformed.',
  'server_error': 'An authentication server error occurred. Please try again later.',
  'temporarily_unavailable': 'The authentication service is temporarily unavailable. Please try again later.',

  // Session-related errors
  'session_expired': 'Your session has expired. Please log in again.',
  'session_invalid': 'Your session is invalid. Please log in again.',
  'logout_required': 'You have been logged out. Please log in again to continue.',

  // Network/connectivity errors
  'network_error': 'A network error occurred during authentication. Please check your connection and try again.',
  'timeout': 'The authentication request timed out. Please try again.',

  // Configuration errors (for admins)
  'misconfigured_client': 'The authentication system is misconfigured. Please contact your administrator.',
  'invalid_redirect_uri': 'Invalid redirect URL configuration. Please contact your administrator.',
} as const;

type AllowedErrorType = keyof typeof ALLOWED_SSO_ERRORS;

/**
 * Extracts and validates error type from URL search parameters.
 * Uses a whitelist approach to prevent malicious content injection.
 */
function extractErrorType(searchParams: URLSearchParams): {
  errorType: AllowedErrorType | null;
  rawMessage: string | null;
  isSuspicious: boolean;
} {
  const message = searchParams.get('message');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Try multiple parameter names commonly used in OAuth/OIDC
  const rawMessage = message || error || errorDescription;

  if (!rawMessage) {
    return { errorType: null, rawMessage: null, isSuspicious: false };
  }

  // Normalize the message for comparison
  const normalizedMessage = rawMessage.toLowerCase().trim();

  // Check for exact matches first
  const exactMatch = Object.keys(ALLOWED_SSO_ERRORS).find(
    key => normalizedMessage === key
  ) as AllowedErrorType | undefined;

  if (exactMatch) {
    return { errorType: exactMatch, rawMessage, isSuspicious: false };
  }

  // Check for partial matches with common error patterns
  const partialMatch = Object.keys(ALLOWED_SSO_ERRORS).find(key => {
    return normalizedMessage.includes(key.replace('_', ' ')) ||
           normalizedMessage.includes(key) ||
           (key === 'expired_token' && (normalizedMessage.includes('expired') || normalizedMessage.includes('token'))) ||
           (key === 'invalid_token' && (normalizedMessage.includes('invalid') && normalizedMessage.includes('token'))) ||
           (key === 'invalid_state' && normalizedMessage.includes('state')) ||
           (key === 'access_denied' && normalizedMessage.includes('denied')) ||
           (key === 'session_expired' && normalizedMessage.includes('session'));
  }) as AllowedErrorType | undefined;

  if (partialMatch) {
    return { errorType: partialMatch, rawMessage, isSuspicious: false };
  }

  // If no match found, consider it suspicious
  return { errorType: null, rawMessage, isSuspicious: true };
}

/**
 * Logs suspicious authentication attempts for security monitoring.
 */
function logSuspiciousActivity(rawMessage: string, userAgent: string, ip?: string) {
  Sentry.captureException(new Error('Suspicious auth error message'), {
    tags: {
      type: 'security_alert',
      category: 'auth_error_injection',
    },
    extra: {
      rawMessage,
      userAgent,
      ip,
      url: window.location.href,
      referrer: document.referrer || 'none',
      timestamp: new Date().toISOString(),
    },
    level: 'warning',
  });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Suspicious auth error message detected:', {
      rawMessage,
      userAgent,
      url: window.location.href,
    });
  }
}

const AuthErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [errorInfo, setErrorInfo] = useState<{
    errorType: AllowedErrorType | null;
    message: string;
    isSuspicious: boolean;
  }>({
    errorType: null,
    message: 'An unexpected authentication error occurred.',
    isSuspicious: false,
  });

  useEffect(() => {
    const { errorType, rawMessage, isSuspicious } = extractErrorType(searchParams);

    if (isSuspicious && rawMessage) {
      // Log the suspicious attempt
      logSuspiciousActivity(rawMessage, navigator.userAgent);

      // Use a generic error message for security
      setErrorInfo({
        errorType: null,
        message: 'An authentication error occurred. Please try logging in again.',
        isSuspicious: true,
      });
    } else if (errorType) {
      setErrorInfo({
        errorType,
        message: ALLOWED_SSO_ERRORS[errorType],
        isSuspicious: false,
      });
    } else {
      setErrorInfo({
        errorType: null,
        message: 'An authentication error occurred. Please try logging in again.',
        isSuspicious: false,
      });
    }

    // Log the error to Sentry for monitoring
    Sentry.captureException(new Error('Authentication Error'), {
      tags: {
        errorType: errorType || 'unknown',
        suspicious: isSuspicious,
      },
      extra: {
        rawMessage,
        path: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer || 'none',
      },
    });
  }, [searchParams]);

  const handleRetryLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `/auth/login?redirect_url=${redirectUrl}`;
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Card
        elevation={6}
        sx={{
          width: '100%',
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <ErrorOutlineIcon
            sx={{
              fontSize: 64,
              color: 'error.main',
            }}
          />

          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            color="text.primary"
          >
            Authentication Error
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 400, lineHeight: 1.6 }}
          >
            {errorInfo.message}
          </Typography>

          {errorInfo.isSuspicious && (
            <Alert severity="warning" sx={{ width: '100%' }}>
              For security reasons, the specific error details have been logged for review by our security team.
            </Alert>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: '100%', mt: 3 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetryLogin}
              startIcon={<RefreshIcon />}
              fullWidth
            >
              Try Login Again
            </Button>

            <Button
              variant="outlined"
              onClick={handleGoHome}
              startIcon={<HomeIcon />}
              fullWidth
            >
              Go Home
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
};

export default AuthErrorPage;
