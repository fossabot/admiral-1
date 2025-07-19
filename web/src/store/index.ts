import { type Action, configureStore, type ThunkAction, type ConfigureStoreOptions } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';
import logger from 'redux-logger';
import { persistStore } from 'redux-persist';

import { sentryReduxEnhancer } from '@/store/enhancers';
import { listenerMiddleware } from '@/store/middleware';
import rootReducer from '@/store/reducer';

// Configure middleware to use Redux Toolkit defaults plus custom ones.
// Disable serializable and immutable checks if performance or special use cases require it.
const middleware: ConfigureStoreOptions['middleware'] = (getDefaultMiddleware) => {
  return getDefaultMiddleware({
    serializableCheck: false,
    immutableCheck: false,
  })
    .concat(listenerMiddleware.middleware)
    .concat(process.env.NODE_ENV !== 'production' ? [logger] : []);
};

// Create the Redux store
const store = configureStore({
  reducer: rootReducer,
  middleware,
  enhancers: (defaultEnhancers) => defaultEnhancers().concat(sentryReduxEnhancer),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create a persistor for storing state across sessions
const persistor = persistStore(store);

// Infer RootState and AppDispatch types from the store
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Define AppThunk model for async actions
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

// Typed hooks
const useDispatch = (): AppDispatch => useReduxDispatch<AppDispatch>();
const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export { store, persistor, useDispatch, useSelector };
