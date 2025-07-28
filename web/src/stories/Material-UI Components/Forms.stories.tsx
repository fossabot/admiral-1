import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Switch,
  Autocomplete,
  Box,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Search,
  Email,
  Phone,
  Person,
} from '@mui/icons-material';

const meta: Meta = {
  title: 'Material-UI Components/Forms',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Form components styled with the Admiral Design System theme.',
      },
    },
  },
};

export default meta;

export const Buttons: StoryObj = {
  render: () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Button Variants</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Button Colors</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained" color="primary">Primary</Button>
          <Button variant="contained" color="secondary">Secondary</Button>
          <Button variant="contained" color="success">Success</Button>
          <Button variant="contained" color="error">Error</Button>
          <Button variant="contained" color="warning">Warning</Button>
          <Button variant="contained" color="info">Info</Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Button Sizes</Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button variant="contained" size="small">Small</Button>
          <Button variant="contained" size="medium">Medium</Button>
          <Button variant="contained" size="large">Large</Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Button States</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained">Normal</Button>
          <Button variant="contained" disabled>Disabled</Button>
        </Stack>
      </Box>
    </Stack>
  ),
};

export const TextFields: StoryObj = {
  render: () => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Text Field Variants</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="Outlined (Default)"
              variant="outlined"
              placeholder="Enter text..."
            />
            <TextField
              fullWidth
              label="Filled"
              variant="filled"
              placeholder="Enter text..."
            />
            <TextField
              fullWidth
              label="Standard"
              variant="standard"
              placeholder="Enter text..."
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Text Field States</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="Normal"
              placeholder="Enter text..."
            />
            <TextField
              fullWidth
              label="Disabled"
              placeholder="Enter text..."
              disabled
            />
            <TextField
              fullWidth
              label="Error"
              placeholder="Enter text..."
              error
              helperText="This field has an error"
            />
            <TextField
              fullWidth
              label="Success"
              placeholder="Enter text..."
              color="success"
              helperText="This field is valid"
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Text Field with Icons</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="user@example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Stack>
    );
  },
};

export const Selects: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [multiValue, setMultiValue] = React.useState<string[]>([]);

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Select Variants</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 3,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Choose Option</InputLabel>
              <Select
                value={value}
                label="Choose Option"
                onChange={(e) => setValue(e.target.value)}
              >
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth disabled>
              <InputLabel>Disabled Select</InputLabel>
              <Select
                value=""
                label="Disabled Select"
              >
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Multiple Select</Typography>
          <FormControl fullWidth>
            <InputLabel>Multiple Options</InputLabel>
            <Select
              multiple
              value={multiValue}
              label="Multiple Options"
              onChange={(e) => setMultiValue(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
              <MenuItem value="option3">Option 3</MenuItem>
              <MenuItem value="option4">Option 4</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
    );
  },
};

export const CheckboxesAndRadios: StoryObj = {
  render: () => {
    const [checked, setChecked] = React.useState({
      option1: false,
      option2: true,
      option3: false,
    });
    const [radioValue, setRadioValue] = React.useState('option1');

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Checkboxes</Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked.option1}
                  onChange={(e) => setChecked({ ...checked, option1: e.target.checked })}
                />
              }
              label="Option 1"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked.option2}
                  onChange={(e) => setChecked({ ...checked, option2: e.target.checked })}
                />
              }
              label="Option 2 (Initially checked)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked.option3}
                  onChange={(e) => setChecked({ ...checked, option3: e.target.checked })}
                />
              }
              label="Option 3"
            />
            <FormControlLabel
              control={<Checkbox disabled />}
              label="Disabled option"
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Radio Buttons</Typography>
          <FormControl>
            <FormLabel>Choose one option</FormLabel>
            <RadioGroup
              value={radioValue}
              onChange={(e) => setRadioValue(e.target.value)}
            >
              <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
              <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
              <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
              <FormControlLabel value="disabled" control={<Radio />} label="Disabled" disabled />
            </RadioGroup>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Checkbox Colors</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <FormControlLabel control={<Checkbox defaultChecked color="primary" />} label="Primary" />
            <FormControlLabel control={<Checkbox defaultChecked color="secondary" />} label="Secondary" />
            <FormControlLabel control={<Checkbox defaultChecked color="success" />} label="Success" />
            <FormControlLabel control={<Checkbox defaultChecked color="error" />} label="Error" />
            <FormControlLabel control={<Checkbox defaultChecked color="warning" />} label="Warning" />
          </Stack>
        </Box>
      </Stack>
    );
  },
};

export const Switches: StoryObj = {
  render: () => {
    const [switches, setSwitches] = React.useState({
      switch1: false,
      switch2: true,
      switch3: false,
    });

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Switch Controls</Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={switches.switch1}
                  onChange={(e) => setSwitches({ ...switches, switch1: e.target.checked })}
                />
              }
              label="Enable notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={switches.switch2}
                  onChange={(e) => setSwitches({ ...switches, switch2: e.target.checked })}
                />
              }
              label="Dark mode (Initially enabled)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={switches.switch3}
                  onChange={(e) => setSwitches({ ...switches, switch3: e.target.checked })}
                />
              }
              label="Auto-save"
            />
            <FormControlLabel
              control={<Switch disabled />}
              label="Disabled setting"
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Switch Colors</Typography>
          <Stack spacing={2}>
            <FormControlLabel control={<Switch defaultChecked color="primary" />} label="Primary" />
            <FormControlLabel control={<Switch defaultChecked color="secondary" />} label="Secondary" />
            <FormControlLabel control={<Switch defaultChecked color="success" />} label="Success" />
            <FormControlLabel control={<Switch defaultChecked color="error" />} label="Error" />
            <FormControlLabel control={<Switch defaultChecked color="warning" />} label="Warning" />
          </Stack>
        </Box>
      </Stack>
    );
  },
};

export const AutocompleteField: StoryObj = {
  render: () => {
    const options = [
      'React',
      'Vue',
      'Angular',
      'Svelte',
      'Solid',
      'Next.js',
      'Nuxt.js',
      'Gatsby',
    ];

    const [value, setValue] = React.useState<string | null>(null);
    const [multiValue, setMultiValue] = React.useState<string[]>([]);

    return (
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Single Selection</Typography>
          <Autocomplete
            options={options}
            value={value}
            onChange={(_, newValue) => setValue(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose framework"
                placeholder="Start typing..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                      {params.InputProps?.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Multiple Selection</Typography>
          <Autocomplete
            multiple
            options={options}
            value={multiValue}
            onChange={(_, newValue) => setMultiValue(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose frameworks"
                placeholder="Select multiple..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Disabled Autocomplete</Typography>
          <Autocomplete
            disabled
            options={options}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Disabled field"
                placeholder="Cannot interact..."
              />
            )}
          />
        </Box>
      </Stack>
    );
  },
};

export const CompleteForm: StoryObj = {
  render: () => {
    const [formData, setFormData] = React.useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      interests: [] as string[],
      newsletter: false,
      terms: false,
    });

    const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia'];
    const interests = ['Technology', 'Design', 'Business', 'Science', 'Arts', 'Sports'];

    return (
      <Box component="form" sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          User Registration Form
        </Typography>

        <Stack spacing={3}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              value={formData.country}
              label="Country"
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            >
              {countries.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={interests}
            value={formData.interests}
            onChange={(_, newValue) => setFormData({ ...formData, interests: newValue })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Interests"
                placeholder="Select your interests..."
              />
            )}
          />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.newsletter}
                  onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                />
              }
              label="Subscribe to newsletter"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                />
              }
              label="I agree to the terms and conditions"
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
            <Button variant="outlined" fullWidth>
              Cancel
            </Button>
            <Button variant="contained" fullWidth>
              Submit
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  },
};
