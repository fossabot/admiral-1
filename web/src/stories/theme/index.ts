// Import the actual application theme instead of creating a separate one
import Palette from '@/theme/palette';
import Typography from '@/theme/typography';
import ComponentStyleOverrides from '@/theme/compStyleOverride';
import { createTheme } from '@mui/material/styles';

// Create Admiral theme using the same source as the application
const basePalette = Palette('light');
const typography = Typography(basePalette);

const themeOptions = {
  palette: basePalette.palette,
  typography,
};

const baseTheme = createTheme(themeOptions);
const customizedComponents = ComponentStyleOverrides(baseTheme);

// Admiral Design System Theme - Same as the application uses
export const admiralTheme = createTheme({
  ...themeOptions,
  components: customizedComponents,
});

// Dark theme variant using the same source
const basePaletteDark = Palette('dark');
const typographyDark = Typography(basePaletteDark);

const themeOptionsDark = {
  palette: basePaletteDark.palette,
  typography: typographyDark,
};

const baseThemeDark = createTheme(themeOptionsDark);
const customizedComponentsDark = ComponentStyleOverrides(baseThemeDark);

export const admiralDarkTheme = createTheme({
  ...themeOptionsDark,
  components: customizedComponentsDark,
});

// Re-export tokens from main theme (single source of truth)
export * from '@/theme/tokens';
