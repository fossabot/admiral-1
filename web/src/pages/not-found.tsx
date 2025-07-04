import React, { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { Container } from '@mui/material';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    Sentry.captureException(new Error('Page Not Found'), {
      tags: {
        status: 404,
        path: window.location.pathname,
      },
      extra: {
        fullUrl: window.location.href,
        query: window.location.search,
        referrer: document.referrer || 'none',
      },
    });
  }, []);

  return (
    <Container
      sx={{
        mx: 'auto',
      }}
    >
      Not Found
    </Container>
  );
};

export default NotFoundPage;
