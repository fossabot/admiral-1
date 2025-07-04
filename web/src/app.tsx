import { RouterProvider } from 'react-router-dom';

import NavigationScroll from '@/components/NavigationScroll';
import Snackbar from '@/components/extended/Snackbar';
import Theme from '@/theme';
import router from '@/routes';

const App: React.FC = () => {
  return (
    <Theme>
      <NavigationScroll>
        <RouterProvider router={router} />
        <Snackbar />
      </NavigationScroll>
    </Theme>
  );
};

export default App;
