import { Theme, TypographyVariantsOptions } from '@mui/material/styles';

const Typography = (theme: Theme): TypographyVariantsOptions => ({
  fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  h6: {
    fontWeight: 600,
    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[900],
    fontSize: '0.8rem',
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  h5: {
    fontSize: '0.9rem',
    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[900],
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  h4: {
    fontSize: '1.1rem',
    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[900],
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '0.005em',
  },
  h3: {
    fontSize: '1.3rem',
    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[900],
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '0.005em',
  },
  h2: {
    fontSize: '1.6rem',
    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[900],
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.005em',
  },
  h1: {
    fontSize: '2rem',
    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[900],
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
  },
  subtitle1: {
    fontSize: '0.875rem',
    fontWeight: 500,
    // color: theme.palette.text.dark
  },
  subtitle2: {
    fontSize: '0.75rem',
    fontWeight: 400,
    color: theme.palette.text.secondary,
  },
  caption: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    fontWeight: 400,
  },
  body1: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.005em',
    color: theme.palette.text.primary,
  },
  body2: {
    fontSize: '0.8rem',
    letterSpacing: '0.005em',
    fontWeight: 400,
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  customInput: {
    marginTop: 1,
    marginBottom: 1,
    '& > label': {
      top: 23,
      left: 0,
      color: theme.palette.grey[500],
      '&[data-shrink="false"]': {
        top: 5,
      },
    },
    '& > div > input': {
      padding: '30.5px 14px 11.5px !important',
    },
    '& legend': {
      display: 'none',
    },
    '& fieldset': {
      top: 0,
    },
  },
  mainContent: {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : theme.palette.grey[100],
    width: '100%',
    minHeight: 'calc(100vh - 72px)',
    flexGrow: 1,
    padding: '16px',
    marginTop: '72px',
    marginRight: '16px',
    borderRadius: '6px',
  },
  menuCaption: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[900],
    padding: '6px',
    textTransform: 'capitalize',
    marginTop: '10px',
  },
  subMenuCaption: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    textTransform: 'capitalize',
  },
  commonAvatar: {
    cursor: 'pointer',
    borderRadius: '8px',
  },
  smallAvatar: {
    width: '22px',
    height: '22px',
    fontSize: '1rem',
  },
  mediumAvatar: {
    width: '34px',
    height: '34px',
    fontSize: '1.2rem',
  },
  largeAvatar: {
    width: '44px',
    height: '44px',
    fontSize: '1.5rem',
  },
});

export default Typography;
