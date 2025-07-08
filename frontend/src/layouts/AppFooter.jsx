import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ py: 2, px: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">
        &copy; {currentYear} C2C Portal
      </Typography>
    </Box>
  );
};

export default AppFooter;