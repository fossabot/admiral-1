import { createSlice } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';

import { type RootState } from '@/store';
import { type MenuState } from '@/types/menu';

const initialState: MenuState = {
  selectedItem: ['dashboard'],
  selectedID: null,
  drawerOpen: false,
  menu: {}
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    activeItem(state, action) {
      state.selectedItem = action.payload;
    },

    activeID(state, action) {
      state.selectedID = action.payload;
    },

    openDrawer(state, action) {
      state.drawerOpen = action.payload;
    },

    getMenuSuccess(state, action) {
      state.menu = action.payload;
    }
  },
});

export const persistConfig = {
  key: 'menu',
  keyPrefix: 'admiral:',
  storage,
};

export const menu = (state: RootState): MenuState => state.menu;
export const { activeItem, openDrawer, activeID } = menuSlice.actions;

export default menuSlice.reducer;
