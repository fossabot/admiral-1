import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type RootState } from '@/store';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  email: string;
  emailVerified?: boolean | undefined;
  name?: string | undefined;
  givenName?: string | undefined;
  familyName?: string | undefined;
  pictureUrl?: string | undefined;
}

export interface UserPreferences {
  themeMode: ThemeMode;
}

export interface UserState {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  givenName: string;
  familyName: string;
  pictureUrl: string;
  preferences: UserPreferences;
}

const initialState: UserState = {
  id: '',
  email: '',
  emailVerified: false,
  name: '',
  givenName: '',
  familyName: '',
  pictureUrl: '',
  preferences: (() => {
    try {
      const savedPreferences = localStorage.getItem('user.preferences');
      if (!savedPreferences) return { themeMode: 'system' as ThemeMode };

      const parsedPreferences = JSON.parse(savedPreferences) as UserPreferences;
      if (typeof parsedPreferences !== 'object' || !('themeMode' in parsedPreferences)) {
        return { themeMode: 'system' as ThemeMode };
      }

      if (!['light', 'dark', 'system'].includes(parsedPreferences.themeMode)) {
        return { themeMode: 'system' as ThemeMode };
      }

      return parsedPreferences;
    } catch {
      return { themeMode: 'system' as ThemeMode };
    }
  })(),
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile>) {
      const { id, email, emailVerified, name, givenName, familyName, pictureUrl } = action.payload;
      state.id = id;
      state.email = email;
      state.emailVerified = emailVerified ?? false;
      state.name = name ?? '';
      state.givenName = givenName ?? '';
      state.familyName = familyName ?? '';
      state.pictureUrl = pictureUrl ?? '';
    },
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.preferences.themeMode = action.payload || initialState.preferences.themeMode;
    }
  },
});

export const { setUser, setThemeMode } = userSlice.actions;

export const selectUser = (state: RootState): UserState => state.user;
export const selectUserProfile = (state: RootState): UserProfile => {
  const { id, email, emailVerified, name, givenName, familyName, pictureUrl } = state.user;
  return { id, email, emailVerified, name, givenName, familyName, pictureUrl };
};
export const selectUserPreferences = (state: RootState): UserPreferences => state.user.preferences;
export const selectThemeMode = (state: RootState): ThemeMode => state.user.preferences.themeMode;

export default userSlice.reducer;