import React, { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Avatar, Box, Skeleton } from '@mui/material';
import { Assignment, Gavel, CheckCircle, Update } from '@mui/icons-material';
import { activityService, ActivityItem } from '../../services/activity.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconFor = (mod: string) => {
  if (mod === 'PCA') return <Assignment color="primary" />;
  if (mod.startsWith('Lic')) return <Gavel sx={{ color: '#fd7e14' }} />;
  if (mod.startsWith('Qual')) return <CheckCircle color="success" />;
  return <Update />;
};

const RecentActivities: React.FC = () => {
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
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Atividades Recentes</Typography>
      {items === null ? (
        <Box>
          {[...Array(5)].map((_, i) => (<Skeleton key={i} height={36} />))}
        </Box>
      ) : (
        <List dense>
          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary">Nenhuma atividade encontrada.</Typography>
          )}
          {items.map((it, idx) => (
            <ListItem key={idx} disableGutters>
              <ListItemIcon sx={{ minWidth: 36 }}>{iconFor(it.module)}</ListItemIcon>
              <ListItemText
                primary={`${it.user} ${it.action === 'created' ? 'criou' : 'atualizou'} ${it.module}: ${it.title}`}
                secondary={formatDistanceToNow(new Date(it.at), { addSuffix: true, locale: ptBR })}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivities;
