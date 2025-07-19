import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';

import { type RootState } from '@/store';
import { type MenuState } from '@/types/menu';

const initialState: MenuState = {
  selectedItem: ['dashboard'],
  selectedID: null,
  drawerOpen: false,
  menu: {},
} as const;

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    activeItem(state, action: PayloadAction<string[]>) {
      state.selectedItem = action.payload;
    },

    activeID(state, action: PayloadAction<string | null>) {
      state.selectedID = action.payload;
    },

    openDrawer(state, action: PayloadAction<boolean>) {
      state.drawerOpen = action.payload;
    },

    getMenuSuccess(state, action: PayloadAction<Record<string, unknown>>) {
      state.menu = action.payload;
    },
  },
});

export const persistConfig = {
  key: 'menu',
  keyPrefix: 'admiral:',
  storage,
};

export const menu = (state: RootState): MenuState => state.menu;
export const { activeItem, activeID, openDrawer, getMenuSuccess } = menuSlice.actions;

export default menuSlice.reducer;
