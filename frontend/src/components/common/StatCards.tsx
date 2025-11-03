import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';

export interface StatItem {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}

const StatCards: React.FC<{ items: StatItem[] }> = ({ items }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {items.map((item, idx) => (
        <Grid item xs={12} sm={6} md={3} key={idx}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              {item.icon ? (
                <Box sx={{ color: item.color || 'primary.main', display: 'grid', placeItems: 'center' }}>
                  {item.icon}
                </Box>
              ) : null}
              <Box>
                <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;

