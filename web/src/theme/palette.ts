import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

import colors from '@/assets/scss/theme.module.scss';

const Palette = (paletteMode: PaletteMode): Theme => {
  return createTheme({
    palette: {
      mode: paletteMode,
      common: {
        black: colors.darkPaper,
      },
      primary: {
        light: paletteMode === 'dark' ? colors.darkPrimaryLight : colors.primaryLight,
        main: paletteMode === 'dark' ? colors.darkPrimaryMain : colors.primaryMain,
        dark: paletteMode === 'dark' ? colors.darkPrimaryDark : colors.primaryDark,
        200: paletteMode === 'dark' ? colors.darkPrimary200 : colors.primary200,
        800: paletteMode === 'dark' ? colors.darkPrimary800 : colors.primary800,
      },
      secondary: {
        light: paletteMode === 'dark' ? colors.darkSecondaryLight : colors.secondaryLight,
        main: paletteMode === 'dark' ? colors.darkSecondaryMain : colors.secondaryMain,
        dark: paletteMode === 'dark' ? colors.darkSecondaryDark : colors.secondaryDark,
        200: paletteMode === 'dark' ? colors.darkSecondary200 : colors.secondary200,
        800: paletteMode === 'dark' ? colors.darkSecondary800 : colors.secondary800,
      },
      error: {
        light: paletteMode === 'dark' ? colors.darkErrorLight : colors.errorLight,
        main: paletteMode === 'dark' ? colors.darkErrorMain : colors.errorMain,
        dark: paletteMode === 'dark' ? colors.darkErrorDark : colors.errorDark,
      },
      orange: {
        light: colors.orangeLight,
        main: colors.orangeMain,
        dark: colors.orangeDark,
      },
      warning: {
        light: paletteMode === 'dark' ? colors.darkWarningLight : colors.warningLight,
        main: paletteMode === 'dark' ? colors.darkWarningMain : colors.warningMain,
        dark: paletteMode === 'dark' ? colors.darkWarningDark : colors.warningDark,
      },
      info: {
        light: paletteMode === 'dark' ? colors.darkInfoLight : colors.infoLight,
        main: paletteMode === 'dark' ? colors.darkInfoMain : colors.infoMain,
        dark: paletteMode === 'dark' ? colors.darkInfoDark : colors.infoDark,
      },
      success: {
        light: paletteMode === 'dark' ? colors.darkSuccessLight : colors.successLight,
        200: colors.success200,
        main: paletteMode === 'dark' ? colors.darkSuccessMain : colors.successMain,
        dark: paletteMode === 'dark' ? colors.darkSuccessDark : colors.successDark,
      },
      grey: {
        50: colors.grey50,
        100: colors.grey100,
        500: paletteMode === 'dark' ? colors.darkTextSecondary : colors.grey500,
        600: paletteMode === 'dark' ? colors.darkTextTitle : colors.grey600,
        700: paletteMode === 'dark' ? colors.darkTextPrimary : colors.grey700,
        900: paletteMode === 'dark' ? colors.darkTextPrimary : colors.grey900,
      },
      dark: {
        light: colors.darkTextPrimary,
        main: colors.darkLevel1,
        dark: colors.darkLevel2,
        800: colors.darkBackground,
        900: colors.darkPaper,
      },
      text: {
        primary: paletteMode === 'dark' ? colors.darkTextPrimary : colors.grey700,
        secondary: paletteMode === 'dark' ? colors.darkTextSecondary : colors.grey500,
        dark: paletteMode === 'dark' ? colors.darkTextPrimary : colors.grey900,
        hint: colors.grey100,
      },
      divider: paletteMode === 'dark' ? colors.grey700 : colors.grey200,
      background: {
        paper: paletteMode === 'dark' ? colors.darkPaper : colors.paper,
        default: paletteMode === 'dark' ? colors.darkBackground : colors.paper,
      },
    },
  });
};

export default Palette;
