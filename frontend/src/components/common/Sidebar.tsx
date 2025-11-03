import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Collapse, Badge, Tooltip } from '@mui/material';
import { Dashboard, Assignment, CheckCircle, Gavel, Assessment, ExpandLess, ExpandMore, ListAlt, Warning, BarChart, AdminPanelSettings, People, ManageAccounts, AccountCircle } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';
import { usePendingRequests } from '../../hooks/usePendingRequests';

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
  { text: 'Início', icon: <Dashboard color="primary" />, path: '/dashboard' },
  {
    text: 'Planejamento',
    icon: <Assignment color="info" />,
    allowedRoles: ['COORDENADOR', 'DIPLAN', 'VISITANTE'],
    subItems: [
      { text: 'Lista de Contratações', icon: <ListAlt color="primary" />, path: '/planejamento' },
      { text: 'Contratações Atrasadas', icon: <Warning color="warning" />, path: '/planejamento/atrasadas' },
      { text: 'Estatísticas', icon: <BarChart color="info" />, path: '/planejamento/estatisticas' },
    ],
  },
  {
    text: 'Qualificação',
    icon: <CheckCircle color="success" />,
    allowedRoles: ['COORDENADOR', 'DIQUALI'],
    subItems: [
      { text: 'Lista de Qualificações', icon: <ListAlt color="success" />, path: '/qualificacao' },
      { text: 'Estatísticas', icon: <BarChart color="success" />, path: '/qualificacao/estatisticas' },
    ],
  },
  {
    text: 'Licitação',
    icon: <Gavel color="warning" />,
    allowedRoles: ['COORDENADOR', 'DIPLI'],
    subItems: [
      { text: 'Lista de Licitações', icon: <ListAlt color="warning" />, path: '/licitacao' },
      { text: 'Estatísticas', icon: <BarChart color="warning" />, path: '/licitacao/estatisticas' },
    ],
  },
  { text: 'Relatórios', icon: <Assessment color="secondary" />, path: '/relatorios' },
  {
    text: 'Administração',
    icon: <AdminPanelSettings color="error" />,
    allowedRoles: ['COORDENADOR'],
    subItems: [
      { text: 'Gerenciar Usuários', icon: <ManageAccounts color="error" />, path: '/admin/gerenciar-usuarios' },
      { text: 'Admin de Usuários', icon: <People color="error" />, path: '/admin/usuarios' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { pendingCount } = usePendingRequests();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleToggleExpand = (itemText: string) => {
    setExpandedItems(prev => (prev.includes(itemText) ? prev.filter(i => i !== itemText) : [...prev, itemText]));
  };

  const filteredMenuItems = menuItems.filter(item => !item.allowedRoles || item.allowedRoles.includes(user?.nivel_acesso || ''));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_CLOSED,
        flexShrink: 0,
        transition: (theme) => theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }),
        [`& .MuiDrawer-paper`]: {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_CLOSED,
          boxSizing: 'border-box',
          transition: (theme) => theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }),
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <Tooltip title={!open ? item.text : ''} placement="right">
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
                    {item.text.startsWith('Admin') && pendingCount > 0 ? (
                      <Badge badgeContent={pendingCount} color="error">{item.icon}</Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                  {open && item.subItems && (expandedItems.includes(item.text) ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {item.subItems && (
              <Collapse in={expandedItems.includes(item.text)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem key={subItem.text} disablePadding>
                      <Tooltip title={!open ? subItem.text : ''} placement="right">
                        <ListItemButton sx={{ pl: open ? 4 : 2 }} selected={location.pathname === subItem.path} onClick={() => navigate(subItem.path)}>
                          <ListItemIcon sx={{ minWidth: open ? 56 : 'auto', mr: open ? 3 : 'auto' }}>
                            {subItem.text.includes('Requisição') && pendingCount > 0 ? (
                              <Badge badgeContent={pendingCount} color="error">{subItem.icon}</Badge>
                            ) : (
                              subItem.icon
                            )}
                          </ListItemIcon>
                          {open && <ListItemText primary={subItem.text} />}
                        </ListItemButton>
                      </Tooltip>
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
