import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  CheckCircle,
  Gavel,
  Assessment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';

const DRAWER_WIDTH = 240;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  allowedRoles?: string[];
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'Planejamento',
    icon: <Assignment />,
    path: '/planejamento',
    allowedRoles: ['COORDENADOR', 'DIPLAN'],
  },
  {
    text: 'Qualificação',
    icon: <CheckCircle />,
    path: '/qualificacao',
    allowedRoles: ['COORDENADOR', 'DIQUALI'],
  },
  {
    text: 'Licitação',
    icon: <Gavel />,
    path: '/licitacao',
    allowedRoles: ['COORDENADOR', 'DIPLI'],
  },
  {
    text: 'Relatórios',
    icon: <Assessment />,
    path: '/relatorios',
  },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    !item.allowedRoles || item.allowedRoles.includes(user?.nivel_acesso || '')
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: DRAWER_WIDTH, 
          boxSizing: 'border-box' 
        },
      }}
    >
      <Toolbar />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;