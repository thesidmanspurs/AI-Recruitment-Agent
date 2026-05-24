import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import { appReducer, initialState, type AppState, type AppAction } from './reducer';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
