import React from 'react';
import { Box, TextField, Button, InputAdornment, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

type ApplicationSearchProps = {
  search: string;
  setSearch: (value: string) => void;
  handleSearch: () => void;
  loading: boolean;
  openDialog: () => void;
};

const ApplicationSearch: React.FC<ApplicationSearchProps> = ({
  search,
  setSearch,
  handleSearch,
  loading,
  openDialog,
}) => {
  const handleClear = () => {
    setSearch('');
  };

  return (
    <Box sx={{
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      mb: 3
    }}>
      <TextField
        fullWidth
        placeholder="Search applications..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
          }
        }}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: loading ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : search ? (
            <InputAdornment position="end">
              <ClearIcon
                sx={{
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' }
                }}
                onClick={handleClear}
              />
            </InputAdornment>
          ) : null,
        }}
      />

      <Button
        variant="contained"
        onClick={openDialog}
        startIcon={<AddIcon />}
        sx={{
          px: 3,
          py: 1,
          whiteSpace: 'nowrap',
          minWidth: 'fit-content',
        }}
      >
        Create Application
      </Button>
    </Box>
  );
};

export default ApplicationSearch;
