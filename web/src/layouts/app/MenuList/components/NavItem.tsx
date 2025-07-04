import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  ButtonBase,
  Chip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { useDispatch, useSelector } from '@/store';
import { RootState } from '@/store/reducer';
import { activeID, activeItem } from '@/store/slices/menu';
import { LinkTarget, NavItemType } from '../types';

interface NavItemProps {
  item: NavItemType;
  level: number;
  parentId?: string;
}

const NavItem = ({ item, level, parentId}: NavItemProps) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const { selectedItem, drawerOpen } = useSelector((state: RootState) => state.menu);
  const isDrawerOpen = typeof drawerOpen === 'boolean' ? drawerOpen : false;
  const isSelected = item.id ? (selectedItem as string[]).includes(item.id) : false;

  const IconComponent = item.icon;
  const itemIcon = IconComponent ? (
    <IconComponent
      stroke={1.5}
      size={isDrawerOpen ? '20px' : '24px'}
      style={{
        color: isSelected ? theme.palette.secondary.main : theme.palette.text.primary,
      }}
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

  const itemTarget: LinkTarget = item.target ? '_blank' : '_self';

  const itemHandler = (id: string) => {
    dispatch(activeItem([id]));
    if (parentId) {
      dispatch(activeID(parentId));
    }
  };

  useEffect(() => {
    if (item.id) {
      // Use pathname from react-router instead of direct DOM access
      const pathSegments = pathname.split('/');
      const currentIndex = pathSegments.findIndex((segment) => segment === item.id);

      if (currentIndex > -1) {
        dispatch(activeItem([item.id]));
      }
    }
  }, [pathname, item.id, dispatch]);

  const textColor = theme.palette.mode === 'dark' ? 'grey.400' : 'text.primary';
  const iconSelectedColor = theme.palette.mode === 'dark' && isDrawerOpen ? 'text.primary' : 'secondary.main';

  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: '8px',
      mb: 0.5,
      pl: isDrawerOpen ? `${level * 24}px` : 1.25,
    };

    const drawerOpenLevelOneStyles = drawerOpen &&
      level === 1 &&
      theme.palette.mode !== 'dark' && {
        '&:hover': {
          backgroundColor: theme.palette.secondary.light,
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.secondary.light,
          color: iconSelectedColor,
          '&:hover': {
            color: iconSelectedColor,
            backgroundColor: theme.palette.secondary.light,
          },
        },
      };

    const drawerClosedOrNotLevelOneStyles = (!isDrawerOpen || level !== 1) && {
      py: level === 1 ? 0 : 1,
      '&:hover': {
        backgroundColor: 'transparent',
      },
      '&.Mui-selected': {
        '&:hover': {
          backgroundColor: 'transparent',
        },
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyles,
      ...(drawerOpenLevelOneStyles || {}),
      ...(drawerClosedOrNotLevelOneStyles || {}),
    };
  };

  const getIconStyles = () => {
    const baseStyles = {
      minWidth: level === 1 ? 36 : 18,
      color: isSelected ? iconSelectedColor : textColor,
    };

    const drawerClosedLevelOneStyles = !isDrawerOpen &&
      level === 1 && {
        borderRadius: '8px',
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 25 : 'secondary.light',
        },
        ...(isSelected && {
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 25 : 'secondary.light',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main + 30 : 'secondary.light',
          },
        }),
      };

    return {
      ...baseStyles,
      ...(drawerClosedLevelOneStyles || {}),
    };
  };

  return (
    <ListItemButton
      component={Link}
      to={item.url || ''}
      target={itemTarget}
      disabled={item.disabled}
      disableRipple={!drawerOpen}
      sx={getButtonStyles()}
      selected={isSelected}
      onClick={() => item.id && itemHandler(item.id)}
    >
      <ButtonBase aria-label="theme-icon" sx={{ borderRadius: '8px' }} disableRipple={isDrawerOpen}>
        <ListItemIcon sx={getIconStyles()}>{itemIcon}</ListItemIcon>
      </ButtonBase>

      {(isDrawerOpen || (!isDrawerOpen && level !== 1)) && (
        <ListItemText
          primary={
            <Typography variant={isSelected ? 'h5' : 'body1'} color="inherit">
              {item.title}
            </Typography>
          }
          secondary={
            item.caption && (
              <Typography variant="caption" sx={{ ...theme.typography.subMenuCaption }} display="block" gutterBottom>
                {item.caption}
              </Typography>
            )
          }
        />
      )}

      {isDrawerOpen && item.chip && (
        <Chip
          color={item.chip.color}
          variant={item.chip.variant}
          size={item.chip.size}
          label={item.chip.label}
          avatar={item.chip.avatar ? <Avatar>{item.chip.avatar}</Avatar> : undefined}
        />
      )}
    </ListItemButton>
  );
};

export default NavItem;
