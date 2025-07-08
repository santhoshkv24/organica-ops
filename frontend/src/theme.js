import { createTheme } from '@mui/material/styles';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/700.css';

const theme = createTheme({
  typography: {
    fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
        },
        body: {
          fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
        },
      },
    },
  },
});

export default theme;
