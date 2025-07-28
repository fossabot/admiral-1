import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  ClickAwayListener,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import NavItem from '../components/NavItem';
import Transitions from '@/components/extended/Transitions';
import { useSelector } from '@/store';
import { NavItemType } from '../types';

const PopperStyledMini = styled(Popper)(({ theme }) => ({
  overflow: 'visible',
  zIndex: 1202,
  minWidth: 180,
  '&:before': {
    content: '""',
    backgroundColor: theme.palette.background.paper,
    transform: 'translateY(-50%) rotate(45deg)',
    zIndex: 120,
    borderLeft: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

interface NavCollapseProps {
  menu: NavItemType;
  level: number;
  parentId: string;
}

const NavCollapse = ({ menu, level, parentId }: NavCollapseProps) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null | undefined>(null);
  const [anchorEl, setAnchorEl] = useState<VirtualElement | (() => VirtualElement) | null | undefined>(null);
  const { drawerOpen } = useSelector((state) => state.menu);

  const handleClickMini = (
    event: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLDivElement, MouseEvent> | undefined,
  ) => {
    setAnchorEl(null);
    if (drawerOpen) {
      setOpen(!open);
    } else {
      setAnchorEl(event?.currentTarget);
    }
  };

  const handleClosePopper = () => {
    setOpen(false);
    setSelected(null);
    setAnchorEl(null);
  };

  const openMini = Boolean(anchorEl);
  const { pathname } = useLocation();

  const checkOpenForParent = (child: NavItemType[], id: string) => {
    child.forEach((item: NavItemType) => {
      if (item.url === pathname) {
        setOpen(true);
        setSelected(id);
      }
    });
  };

  useEffect(() => {
    setOpen(false);
    setSelected(null);
    if (openMini) setAnchorEl(null);
    if (menu.children) {
      menu.children.forEach((item: NavItemType) => {
        if (item.children?.length) {
          checkOpenForParent(item.children, menu.id!);
        }
        if (item.url === pathname) {
          setSelected(menu.id);
          setOpen(true);
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, menu.children]);

  const menus = menu.children?.map((item) => {
    switch (item.type) {
      case 'collapse':
        return <NavCollapse key={item.id} menu={item} level={level + 1} parentId={parentId} />;
      case 'item':
        return <NavItem key={item.id} item={item} level={level + 1} parentId={parentId} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  const isSelected = selected === menu.id;
  const Icon = menu.icon!;
  const menuIcon = menu.icon ? (
    <Icon
      strokeWidth={1.5}
      size={drawerOpen ? '20px' : '24px'}
      style={{ color: isSelected ? theme.palette.secondary.main : theme.palette.text.primary }}
    />
  ) : (
    <FiberManualRecordIcon
      sx={{
        color: isSelected ? theme.palette.secondary.main : theme.palette.text.primary,
        width: isSelected ? 8 : 6,
        height: isSelected ? 8 : 6,
      }}
      fontSize={level > 0 ? 'inherit' : 'medium'}
    />
  );

  const renderCollapseIcon = () => {
    if (!drawerOpen) {
      return null;
    }

    if (openMini || open) {
      return <ExpandLessIcon sx={{ fontSize: '16px', marginTop: 'auto', marginBottom: 'auto', strokeWidth: 1.5 }} />;
    }

    return <ExpandMoreIcon sx={{ fontSize: '16px', marginTop: 'auto', marginBottom: 'auto', strokeWidth: 1.5 }} />;
  };

  const textColor = theme.palette.mode === 'dark' ? 'grey.400' : 'text.primary';
  const iconSelectedColor = theme.palette.mode === 'dark' && drawerOpen ? 'text.primary' : 'secondary.main';

  const getListItemButtonSx = () => {
    const baseStyles = {
      zIndex: 1201,
      borderRadius: '8px',
      mb: 0.5,
      pl: drawerOpen ? `${level * 24}px` : 1.25,
    };

    if (drawerOpen && level === 1 && theme.palette.mode !== 'dark') {
      return {
        ...baseStyles,
        '&:hover': {
          background: theme.palette.secondary.light,
        },
        '&.Mui-selected': {
          background: theme.palette.secondary.light,
          color: iconSelectedColor,
          '&:hover': {
            color: iconSelectedColor,
            background: theme.palette.secondary.light,
          },
        },
      };
    }

    if (!drawerOpen || level !== 1) {
      return {
        ...baseStyles,
        py: level === 1 ? 0 : 1,
        '&:hover': {
          bgcolor: 'transparent',
        },
        '&.Mui-selected': {
          '&:hover': {
            bgcolor: 'transparent',
          },
          bgcolor: 'transparent',
        },
      };
    }

    return baseStyles;
  };

  return (
    <>
      <ListItemButton
        sx={getListItemButtonSx()}
        selected={isSelected}
        {...(!drawerOpen && { onMouseEnter: handleClickMini, onMouseLeave: handleClosePopper })}
        onClick={handleClickMini}
      >
        {menuIcon && (
          <ListItemIcon
            sx={{
              minWidth: level === 1 ? 36 : 18,
              color: isSelected ? iconSelectedColor : textColor,
              ...(!drawerOpen &&
                level === 1 && {
                  borderRadius: `8px`,
                  width: 46,
                  height: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 25 : 'secondary.light',
                  },
                  ...(isSelected && {
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 25 : 'secondary.light',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 30 : 'secondary.light',
                    },
                  }),
                }),
            }}
          >
            {menuIcon}
          </ListItemIcon>
        )}
        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          <ListItemText
            primary={
              <Typography variant={isSelected ? 'h5' : 'body1'} color="inherit" sx={{ my: 'auto' }}>
                {menu.title}
              </Typography>
            }
            secondary={
              menu.caption && (
                <Typography variant="caption" sx={{ ...theme.typography.subMenuCaption }} display="block" gutterBottom>
                  {menu.caption}
                </Typography>
              )
            }
          />
        )}

        {renderCollapseIcon()}

        {!drawerOpen && (
          <PopperStyledMini
            open={openMini}
            anchorEl={anchorEl}
            placement="right-start"
            style={{
              zIndex: 2001,
            }}
            modifiers={[
              {
                name: 'offset',
                options: {
                  offset: [-12, 0],
                },
              },
            ]}
          >
            {({ TransitionProps }) => (
              <Transitions in={openMini} {...TransitionProps}>
                <Paper
                  sx={{
                    overflow: 'hidden',
                    mt: 1.5,
                    p: 1,
                    boxShadow: theme.shadows[8],
                    backgroundImage: 'none',
                  }}
                >
                  <ClickAwayListener onClickAway={handleClosePopper}>
                    <Box>{menus}</Box>
                  </ClickAwayListener>
                </Paper>
              </Transitions>
            )}
          </PopperStyledMini>
        )}
      </ListItemButton>
      {drawerOpen && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {open && (
            <List
              component="div"
              disablePadding
              sx={{
                position: 'relative',
                '&:after': {
                  content: "''",
                  position: 'absolute',
                  left: '32px',
                  top: 0,
                  height: '100%',
                  width: '1px',
                  opacity: theme.palette.mode === 'dark' ? 0.2 : 1,
                  background: theme.palette.mode === 'dark' ? theme.palette.dark.light : theme.palette.primary.light,
                },
              }}
            >
              {menus}
            </List>
          )}
        </Collapse>
      )}
    </>
  );
};

export default NavCollapse;
