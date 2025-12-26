import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { amoreTheme } from './styles/theme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={amoreTheme}>
      <App />
    </ThemeProvider>
  </StyledEngineProvider>
);