import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  CheckCircle,
  Gavel,
  Assessment,
  ExpandLess,
  ExpandMore,
  ListAlt,
  Warning,
  BarChart,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_CLOSED = 64;

interface SubMenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  allowedRoles?: string[];
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  open: boolean;
}

const menuItems: MenuItem[] = [
  {
    text: 'Início',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'Planejamento',
    icon: <Assignment />,
    allowedRoles: ['COORDENADOR', 'DIPLAN'],
    subItems: [
      {
        text: 'Lista de Contratações',
        icon: <ListAlt />,
        path: '/planejamento',
      },
      {
        text: 'Contratações Atrasadas',
        icon: <Warning />,
        path: '/planejamento/atrasadas',
      },
      {
        text: 'Estatísticas',
        icon: <BarChart />,
        path: '/planejamento/estatisticas',
      },
    ],
  },
  {
    text: 'Qualificação',
    icon: <CheckCircle />,
    allowedRoles: ['COORDENADOR', 'DIQUALI'],
    subItems: [
      {
        text: 'Lista de Qualificações',
        icon: <ListAlt />,
        path: '/qualificacao',
      },
      {
        text: 'Estatísticas',
        icon: <BarChart />,
        path: '/qualificacao/estatisticas',
      },
    ],
  },
  {
    text: 'Licitação',
    icon: <Gavel />,
    allowedRoles: ['COORDENADOR', 'DIPLI'],
    subItems: [
      {
        text: 'Lista de Licitações',
        icon: <ListAlt />,
        path: '/licitacao',
      },
      {
        text: 'Estatísticas',
        icon: <BarChart />,
        path: '/licitacao/estatisticas',
      },
    ],
  },
  {
    text: 'Relatórios',
    icon: <Assessment />,
    path: '/relatorios',
  },
  {
    text: 'Administração',
    icon: <AdminPanelSettings />,
    allowedRoles: ['COORDENADOR'],
    path: '/admin/usuarios',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleToggleExpand = (itemText: string) => {
    setExpandedItems(prev =>
      prev.includes(itemText)
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText]
    );
  };

  const filteredMenuItems = menuItems.filter(item =>
    !item.allowedRoles || item.allowedRoles.includes(user?.nivel_acesso || '')
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_CLOSED,
        flexShrink: 0,
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        [`& .MuiDrawer-paper`]: { 
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_CLOSED,
          boxSizing: 'border-box',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={item.path ? location.pathname === item.path : false}
                onClick={() => {
                  if (item.subItems) {
                    handleToggleExpand(item.text);
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: open ? 56 : 'auto', mr: open ? 3 : 'auto' }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} />}
                {open && item.subItems && (
                  expandedItems.includes(item.text) ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {item.subItems && (
              <Collapse in={expandedItems.includes(item.text)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem key={subItem.text} disablePadding>
                      <ListItemButton
                        sx={{ pl: open ? 4 : 2 }}
                        selected={location.pathname === subItem.path}
                        onClick={() => navigate(subItem.path)}
                      >
                        <ListItemIcon sx={{ minWidth: open ? 56 : 'auto', mr: open ? 3 : 'auto' }}>
                          {subItem.icon}
                        </ListItemIcon>
                        {open && <ListItemText primary={subItem.text} />}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;