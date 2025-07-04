import { useTheme } from '@mui/material/styles';
import MuiChip, { ChipProps } from '@mui/material/Chip';
import { SxProps, Theme, alpha } from '@mui/material';

type ChipColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'orange';

interface CustomChipProps extends Omit<ChipProps, 'color'> {
  chipColor?: ChipColor;
  sx?: SxProps<Theme>;
}

const Chip = ({ chipColor = 'primary', disabled, sx = {}, variant, ...others }: CustomChipProps) => {
  const theme = useTheme();

  const getColorStyles = (color: ChipColor, isOutlined: boolean) => {
    const palette = {
      main: theme.palette.primary.main,
      light: theme.palette.primary.light,
      dark: theme.palette.primary.dark,
    };

    switch (color) {
      case 'secondary':
        palette.main = theme.palette.secondary.main;
        palette.light = theme.palette.secondary.light;
        palette.dark = theme.palette.secondary.dark;
        break;
      case 'success':
        palette.main = theme.palette.success.main;
        palette.light = theme.palette.success.light;
        palette.dark = theme.palette.success.dark;
        break;
      case 'error':
        palette.main = theme.palette.error.main;
        palette.light = theme.palette.error.light;
        palette.dark = theme.palette.error.dark;
        break;
      case 'warning':
        palette.main = theme.palette.warning.main;
        palette.light = theme.palette.warning.light;
        palette.dark = theme.palette.warning.dark;
        break;
      case 'orange':
        // Handle the optional orange color safely
        palette.main = theme.palette.orange?.main || theme.palette.primary.main;
        palette.light = theme.palette.orange?.light || theme.palette.primary.light;
        palette.dark = theme.palette.orange?.dark || theme.palette.primary.dark;
        break;
    }

    if (isOutlined) {
      return {
        color: palette.main,
        bgcolor: 'transparent',
        border: '1px solid',
        borderColor: palette.main,
        ':hover': {
          color: theme.palette.mode === 'dark' ? palette.light : palette.main,
          bgcolor: theme.palette.mode === 'dark' ? palette.main : alpha(palette.light, 0.2),
        },
      };
    } else {
      return {
        color: theme.palette.mode === 'dark' ? palette.light : palette.main,
        bgcolor: theme.palette.mode === 'dark' ? palette.main : alpha(palette.light, 0.6),
        ':hover': {
          color: palette.light,
          bgcolor: theme.palette.mode === 'dark' ? alpha(palette.dark, 0.9) : palette.dark,
        },
      };
    }
  };

  const getDisabledStyles = (isOutlined: boolean) => {
    if (isOutlined) {
      return {
        color: theme.palette.grey[500],
        bgcolor: 'transparent',
        border: '1px solid',
        borderColor: theme.palette.grey[500],
        ':hover': {
          color: theme.palette.grey[500],
          bgcolor: 'transparent',
        },
      };
    } else {
      return {
        color: theme.palette.grey[500],
        bgcolor: theme.palette.grey[50],
        ':hover': {
          color: theme.palette.grey[500],
          bgcolor: theme.palette.grey[50],
        },
      };
    }
  };

  const isOutlined = variant === 'outlined';
  const baseStyles = disabled ? getDisabledStyles(isOutlined) : getColorStyles(chipColor, isOutlined);

  const finalSx = { ...baseStyles, ...sx };

  return <MuiChip variant={variant} disabled={disabled} {...others} sx={finalSx} />;
};

export default Chip;
