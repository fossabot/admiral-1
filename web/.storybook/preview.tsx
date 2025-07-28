import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { admiralTheme, admiralDarkTheme } from '../src/stories/theme';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    docs: {
      // Use default Storybook docs theme
    },

    // Configure dark mode support
    darkMode: {
      // Override the default dark theme
      dark: { ...admiralDarkTheme },
      light: { ...admiralTheme },
      // Use Admiral's background colors
      darkClass: 'dark',
      lightClass: 'light',
      stylePreview: true,
    },
  },

  decorators: [
    (Story, context) => {
      // Use Admiral's actual theme switching logic
      const isDark = context.globals.theme === 'dark';
      const theme = isDark ? admiralDarkTheme : admiralTheme;

      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Story />
        </ThemeProvider>
      );
    },
  ],

  globalTypes: {
    theme: {
      description: 'Admiral Theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
