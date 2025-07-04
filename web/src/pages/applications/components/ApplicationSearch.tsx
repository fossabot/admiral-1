import React from 'react';
import { Box, TextField, Button, InputAdornment, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'center', mb: 2 }}>
      <TextField
        size="small"
        placeholder="Find an application…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
          }
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={16} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button variant="contained" onClick={openDialog}>
        + Create Application
      </Button>
    </Box>
  );
};

export default ApplicationSearch;
