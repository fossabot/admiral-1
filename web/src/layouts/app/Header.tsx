import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  ListItemIcon,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/PowerSettingsNew';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState } from '@/store';
import { ThemeMode, setThemeMode } from '@/store/slices/user';

const ThemeSelector = ({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (event: React.MouseEvent<HTMLElement>, value: ThemeMode | null) => void;
}) => (
  <Box sx={{ px: 1, py: 0.5 }}>
    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
      Theme
    </Typography>
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={onChange}
      aria-label="theme mode"
      size="small"
      fullWidth
      sx={{ mb: 1 }}
    >
      <ToggleButton value="light" aria-label="light mode">
        <Stack direction="row" spacing={1} alignItems="center">
          <LightModeIcon fontSize="small" />
          <Typography variant="body2">Light</Typography>
        </Stack>
      </ToggleButton>
      <ToggleButton value="dark" aria-label="dark mode">
        <Stack direction="row" spacing={1} alignItems="center">
          <DarkModeIcon fontSize="small" />
          <Typography variant="body2">Dark</Typography>
        </Stack>
      </ToggleButton>
      <ToggleButton value="system" aria-label="system mode">
        <Stack direction="row" spacing={1} alignItems="center">
          <SettingsBrightnessIcon fontSize="small" />
          <Typography variant="body2">Auto</Typography>
        </Stack>
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { name, pictureUrl } = useSelector((s: RootState) => s.user);
  const themeMode = useSelector((s: RootState) => s.user.preferences.themeMode);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    navigate('/auth/logout');
    handleMenuClose();
  };

  const handleThemeChange = (_: React.MouseEvent<HTMLElement>, newTheme: ThemeMode | null) => {
    if (newTheme !== null) {
      dispatch(setThemeMode(newTheme));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box />
      <IconButton onClick={handleMenuOpen} size="small">
        <Avatar
          alt={name}
          src={pictureUrl}
          sx={{
            width: 32,
            height: 32,
            boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 0px',
          }}
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              borderRadius: 2,
              minWidth: 220,
              backgroundColor: 'background.paper',
              p: 1,
            },
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableAutoFocusItem
      >
        <ThemeSelector value={themeMode} onChange={handleThemeChange} />
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ borderRadius: 1 }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Header;
