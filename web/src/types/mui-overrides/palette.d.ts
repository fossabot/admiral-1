// eslint-disable-next-line
import { Palette, PaletteOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteColor {
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  }

  interface TypeText {
    dark: string;
    hint: string;
  }

  // Define IconPaletteColorOptions if needed
  interface IconPaletteColorOptions {
    [key: string]: string;
  }

  // Define IconPaletteColor if needed
  interface IconPaletteColor {
    [key: string]: string;
  }

  interface PaletteOptions {
    orange?: PaletteColorOptions;
    dark?: PaletteColorOptions;
    icon?: IconPaletteColorOptions;
  }

  interface Palette {
    orange: PaletteColor;
    dark: PaletteColor;
    icon: IconPaletteColor;
  }
}
