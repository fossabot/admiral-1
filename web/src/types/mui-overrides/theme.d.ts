// eslint-disable-next-line
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface ThemeOptions {
    customization?: TypographyOptions | ((palette: Palette) => TypographyOptions);
    darkTextSecondary?: string;
    textDark?: string;
    darkTextPrimary?: string;
    grey500?: string;
  }
  interface Theme {
    customization: Typography;
    darkTextSecondary: string;
    textDark: string;
    grey500: string;
    darkTextPrimary: string;
  }
}
