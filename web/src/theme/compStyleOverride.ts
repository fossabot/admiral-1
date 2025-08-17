import { Theme } from '@mui/material/styles';

export default function componentStyleOverrides(theme: Theme) {
  const mode = theme.palette.mode;
  const menuSelectedBack = mode === 'dark' ? theme.palette.secondary.main + 15 : theme.palette.secondary.light;
  const menuSelected = theme.palette.secondary.main;

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: '6px',
          textTransform: 'none' as const,
          boxShadow: 'none',
          '&.MuiButton-sizeSmall': {
            padding: '6px 12px',
            fontSize: '0.8125rem',
            minHeight: '32px',
          },
          '&.MuiButton-sizeMedium': {
            padding: '8px 16px',
            fontSize: '0.875rem',
            minHeight: '36px',
          },
          '&.MuiButton-sizeLarge': {
            padding: '11px 22px',
            fontSize: '0.9375rem',
            minHeight: '42px',
          },
          '&.Mui-disabled': {
            color: mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[500],
            backgroundColor: mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
            borderColor: mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
          '&.Mui-disabled': {
            background: mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
            color: mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[500],
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
          '&.Mui-disabled': {
            borderColor: mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
            color: mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[500],
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.palette.grey[200]}`,
          boxShadow:
            mode === 'dark'
              ? '0px 4px 20px rgba(0, 0, 0, 0.5), 0px 1px 3px rgba(0, 229, 255, 0.1)'
              : '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease-in-out',
          backgroundColor: mode === 'dark' ? theme.palette.background.paper : theme.palette.background.paper,
          '&:hover': {
            boxShadow:
              mode === 'dark'
                ? '0px 8px 30px rgba(0, 0, 0, 0.6), 0px 2px 6px rgba(0, 229, 255, 0.2)'
                : '0px 8px 30px rgba(0, 0, 0, 0.12), 0px 2px 6px rgba(0, 0, 0, 0.08)',
          },
        },
        rounded: {
          borderRadius: '12px',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          padding: '16px 20px 12px 20px',
          borderBottom: `1px solid ${mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[100]}`,
        },
        title: {
          fontSize: '1.1rem',
          fontWeight: 600,
        },
        subheader: {
          marginTop: '2px',
          fontSize: '0.8rem',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
          '&:first-of-type': {
            paddingTop: '24px',
          },
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px 16px 20px',
          borderTop: `1px solid ${mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[100]}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          alignItems: 'center',
        },
        outlined: {
          border: '1px dashed',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          paddingTop: '10px',
          paddingBottom: '10px',
          '&.Mui-selected': {
            color: menuSelected,
            backgroundColor: menuSelectedBack,
            '&:hover': {
              backgroundColor: menuSelectedBack,
            },
            '& .MuiListItemIcon-root': {
              color: menuSelected,
            },
          },
          '&:hover': {
            backgroundColor: menuSelectedBack,
            color: menuSelected,
            '& .MuiListItemIcon-root': {
              color: menuSelected,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          minWidth: '36px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: theme.palette.text.dark,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: theme.palette.text.dark,
          '&::placeholder': {
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            opacity: 1,
            lineHeight: 'inherit',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          borderRadius: '8px',
          transition: 'all 0.2s ease-in-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[300],
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
          },
          '&.MuiInputBase-multiline': {
            padding: 1,
          },
        },
        input: {
          fontWeight: 400,
          padding: '12px 14px',
          borderRadius: '6px',
          fontSize: '0.875rem',
          '&::placeholder': {
            transform: 'none',
            lineHeight: 'inherit',
          },
          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 12px',
            fontSize: '0.8rem',
            '&.MuiInputBase-inputAdornedStart': {
              paddingLeft: 0,
            },
          },
        },
        inputAdornedStart: {
          paddingLeft: 4,
        },
        notchedOutline: {
          borderRadius: `4px`,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: mode === 'dark' ? theme.palette.text.primary + 50 : theme.palette.grey[300],
          },
        },
        mark: {
          backgroundColor: theme.palette.background.paper,
          width: '4px',
        },
        valueLabel: {
          color: mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.light,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiAutocomplete-tag': {
            background: mode === 'dark' ? theme.palette.text.primary + 20 : theme.palette.secondary.light,
            borderRadius: 4,
            color: theme.palette.text.dark,
            '.MuiChip-deleteIcon': {
              color: mode === 'dark' ? theme.palette.text.primary + 80 : theme.palette.secondary[200],
            },
          },
        },
        popper: {
          borderRadius: `4px`,
          boxShadow:
            '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider,
          opacity: mode === 'dark' ? 0.2 : 1,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? theme.palette.dark.main : theme.palette.primary.dark,
          background: mode === 'dark' ? theme.palette.text.primary : theme.palette.primary[200],
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-deletable .MuiChip-deleteIcon': {
            color: 'inherit',
          },
        },
      },
    },
    MuiTimelineContent: {
      styleOverrides: {
        root: {
          color: theme.palette.text.dark,
          fontSize: '16px',
        },
      },
    },
    MuiTreeItem: {
      styleOverrides: {
        label: {
          marginTop: 14,
          marginBottom: 14,
        },
      },
    },
    MuiTimelineDot: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiInternalDateTimePickerTabs: {
      styleOverrides: {
        tabs: {
          backgroundColor: mode === 'dark' ? theme.palette.dark[900] : theme.palette.primary.light,
          '& .MuiTabs-flexContainer': {
            borderColor: mode === 'dark' ? theme.palette.text.primary + 20 : theme.palette.primary[200],
          },
          '& .MuiTab-root': {
            color: mode === 'dark' ? theme.palette.text.secondary : theme.palette.grey[900],
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.dark,
          },
          '& .Mui-selected': {
            color: theme.palette.primary.dark,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        flexContainer: {
          borderBottom: '1px solid',
          borderColor: mode === 'dark' ? theme.palette.text.primary + 20 : theme.palette.grey[200],
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          padding: '12px 0 12px 0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? theme.palette.text.primary + 15 : theme.palette.grey[200],
          '&.MuiTableCell-head': {
            fontSize: '0.875rem',
            color: mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[900],
            fontWeight: 500,
          },
        },
      },
    },
    MuiDateTimePickerToolbar: {
      styleOverrides: {
        timeDigitsContainer: {
          alignItems: 'center',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: theme.palette.background.paper,
          background: theme.palette.text.primary,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          margin: '3px',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700],
          fontSize: '0.75rem',
          marginTop: '2px',
          marginLeft: 0,
          marginRight: 0,
          lineHeight: 1.4,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[700],
          fontSize: '0.875rem',
          transform: 'translate(14px, 12px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
          },
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        },
      },
    },
  };
}
