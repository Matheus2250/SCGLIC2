import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { AccountCircle, ExitToApp, Menu as MenuIcon, ManageAccounts } from '@mui/icons-material';
import { useAuth } from '../../store/auth.context';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleGoProfile = () => {
    navigate('/perfil');
    handleClose();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={onSidebarToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Sistemas de Informações CGLIC
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.nome_completo} ({user?.nivel_acesso})
          </Typography>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleGoProfile}>
              <ListItemIcon>
                <ManageAccounts fontSize="small" />
              </ListItemIcon>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Sair
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

