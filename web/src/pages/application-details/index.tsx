import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

const ApplicationDetailPage: React.FC = () => {
  const [tab, setTab] = useState(0);        // 0=Overview,1=Manifests,2=Values,3=Settings,4=Envs
  const [env, setEnv] = useState('dev');    // current environment

  const handleTab = (_: React.SyntheticEvent, idx: number) => setTab(idx);
  const envs = ['dev','staging','prod'];

  return (
    <Box>
      {/* Tabs */}
      <Tabs value={tab} onChange={handleTab} variant="scrollable" scrollButtons>
        {['Overview','Manifests','Values','Foo','Envs'].map((label, i) => (
          <Tab
            key={i}
            label={label === 'Envs'
              ? `Envs: ${env}`       // show env selector inline
              : label
            }
            // optionally add a dropdown for envs
            {...(label==='Envs'
              ? { onClick: () => {/* open menu to pick env */} }
              : {})}
          />
        ))}
      </Tabs>

      <Paper sx={{ mt:2, p:2 }}>
        {tab === 0 && (
          <Box>
            <Typography variant="h6">Overview</Typography>
            <Typography paragraph>
              <strong>Slug:</strong> 17c87cd3-52bf-4aa4-8df7-122f681a8aeb
            </Typography>
            <Typography paragraph>
              <strong>Description:</strong> Atlantis is an open-source…
            </Typography>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Manifests</Typography>
              <Button variant="outlined">Add New Chart</Button>
            </Stack>
            <List>
              <ListItem secondaryAction={<Button size="small">Edit</Button>}>
                <ListItemText primary="Chart.yaml" secondary="atlantis-chart/Chart.yaml" />
              </ListItem>
              <Divider/>
              <ListItem secondaryAction={<Button size="small">Edit</Button>}>
                <ListItemText primary="values.dev.yaml" secondary="atlantis-chart/values.dev.yaml" />
              </ListItem>
              {/* …more items… */}
            </List>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Values</Typography>
              <Button variant="outlined">Edit Default</Button>
            </Stack>
            {/* Could embed a code editor, or JSON viewer… */}
            <Typography variant="body2" color="text.secondary">
              {`{
  replicas: 2,
  image:
    repository: ghcr.io/…
}`}
            </Typography>
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Typography variant="h6" mb={1}>Settings</Typography>
            <Typography><strong>Repository URL:</strong> github.com/…</Typography>
            <Typography><strong>Webhook Enabled:</strong> Yes</Typography>
            {/* …more key/value settings… */}
          </Box>
        )}

        {tab === 4 && (
          <Box>
            <Stack direction="row" spacing={1} mb={1}>
              {envs.map(e => (
                <Button
                  key={e}
                  size="small"
                  variant={e===env?'contained':'outlined'}
                  onClick={() => setEnv(e)}
                >
                  {e}
                </Button>
              ))}
            </Stack>
            <Typography variant="body2">
              Here you can override settings per-environment.
            </Typography>
            {/* e.g. list of overrides */}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ApplicationDetailPage;

//
// const ApplicationDetails: React.FC = () => {
//   const [application, setApplication] = useState<Application | null>(null);
//   const [isLoading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//
//   const { slug } = useParams<{ slug?: string }>();
//
//   useEffect(() => {
//     const fetchData = async (): Promise<void> => {
//       if (!slug) {
//         setError('Invalid application ID');
//         setLoading(false);
//         return;
//       }
//
//       try {
//         const app = await services.application.get(slug);
//         setApplication(app);
//         setLoading(false);
//       } catch (err: unknown) {
//         const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
//         setError(errorMessage);
//         setLoading(false);
//         console.error('Fetch error:', err);
//       }
//     };
//
//     void fetchData();
//   }, [slug]);
//
//   if (isLoading) {
//     return (
//       <div>
//         <p>Loading...</p>
//       </div>
//     );
//   }
//
//   if (error) {
//     return (
//       <div>
//         <p>Error: {error}</p>
//       </div>
//     );
//   }
//
//   if (!application) {
//     return (
//       <div>
//         <p>No application found.</p>
//       </div>
//     );
//   }
//
//   return (
//     <div>
//       <p>Application: {application.name}</p>
//       <p>Slug: {slug}</p>
//     </div>
//   );
// };
//
// export default ApplicationDetails;
