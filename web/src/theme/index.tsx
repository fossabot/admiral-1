import React, { ReactNode, useMemo } from 'react';
import {
  createTheme,
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider as MuiThemeProvider,
  type Theme as MuiTheme,
  useMediaQuery,
  PaletteMode,
} from '@mui/material';
import { useSelector } from 'react-redux';

import ComponentStyleOverrides from '@/theme/compStyleOverride';
import Typography from '@/theme/typography';
import Palette from '@/theme/palette';
import { selectUserPreferences } from '@/store/slices/user';

interface CustomThemeProviderProps {
  children: ReactNode;
}

const useCustomTheme = (): MuiTheme => {
  const preferences = useSelector(selectUserPreferences);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  let paletteMode: PaletteMode = prefersDarkMode ? 'dark' : 'light';
  if (preferences.themeMode !== 'system') {
    paletteMode = preferences.themeMode as PaletteMode;
  }

  const palette = useMemo(() => Palette(paletteMode), [paletteMode]);
  const typography = useMemo(() => Typography(palette), [palette]);

  const themeOptions = useMemo(
    () => ({
      palette: palette.palette,
      typography,
    }),
    [palette, typography],
  );

  return useMemo(() => {
    try {
      const baseTheme = createTheme(themeOptions);
      const customizedTheme = ComponentStyleOverrides(baseTheme);
      return createTheme({
        ...themeOptions,
        components: customizedTheme,
      });
    } catch (error) {
      console.error('Error creating theme:', error);
      return createTheme();
    }
  }, [themeOptions]);
};

const Theme = ({ children }: CustomThemeProviderProps): React.JSX.Element => {
  const customTheme = useCustomTheme();

  return (
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={customTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </StyledEngineProvider>
  );
};

export default Theme;

// Export design tokens
// eslint-disable-next-line react-refresh/only-export-components
export * from './tokens';
