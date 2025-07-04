import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '@/store';
import { ConfigProvider } from '@/context/config';
import App from '@/app';

import '@/assets/scss/style.scss';

createRoot(document.getElementById('root')!).render(
  <ConfigProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </ConfigProvider>,
);
