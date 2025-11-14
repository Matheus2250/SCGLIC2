import React, { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Box, Skeleton } from '@mui/material';
import { Assignment, Gavel, CheckCircle, Update, Upload } from '@mui/icons-material';
import { activityService, ActivityItem } from '../../services/activity.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconFor = (mod: string, action?: ActivityItem['action']) => {
  if (action === 'import') return <Upload color="primary" />;
  if (mod === 'PCA') return <Assignment color="primary" />;
  if (mod.startsWith('Lic')) return <Gavel sx={{ color: '#fd7e14' }} />;
  if (mod.startsWith('Qual')) return <CheckCircle color="success" />;
  return <Update />;
};

const RecentActivitiesNew: React.FC = () => {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await activityService.recent(20);
        setItems(data);
      } catch (e) {
        setError('Não foi possível carregar atividades');
        setItems([]);
      }
    })();
  }, []);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>Atividades Recentes</Typography>
      {items === null ? (
        <Box>
          {[...Array(5)].map((_, i) => (<Skeleton key={i} height={36} />))}
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, minHeight: 0 }}>
          <List dense disablePadding>
            {items.length === 0 && (
              <Typography variant="body2" color="text.secondary">Nenhuma atividade encontrada.</Typography>
            )}
            {items.map((it, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>{iconFor(it.module, it.action)}</ListItemIcon>
                <ListItemText
                  primary={`${it.user} ${it.action === 'created' ? 'criou' : it.action === 'updated' ? 'atualizou' : 'importou'} ${it.module}: ${it.title}`}
                  secondary={formatDistanceToNow(new Date(it.at), { addSuffix: true, locale: ptBR })}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default RecentActivitiesNew;

