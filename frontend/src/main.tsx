import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider, readStoredTheme, applyThemeClass } from './store/ThemeContext';

// Apply the persisted/default theme BEFORE React mounts so there's no flash of
// the wrong theme on first paint.
applyThemeClass(readStoredTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
