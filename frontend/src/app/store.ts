import { configureStore } from "@reduxjs/toolkit";
import toggleReducer from "../store/themeSlice";

export const store = configureStore({
  reducer: {
    theme: toggleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;