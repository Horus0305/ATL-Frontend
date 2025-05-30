import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: true,
  isMobile: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const { toggleSidebar, setMobile, setTheme } = uiSlice.actions;
export default uiSlice.reducer; 