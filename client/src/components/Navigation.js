import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="text-primary">
          📞 Справочник компании
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={location.pathname === '/dashboard' ? 'active fw-bold' : ''}
            >
              Сотрудники
            </Nav.Link>
            {user.role === 'admin' && (
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={location.pathname === '/admin' ? 'active fw-bold' : ''}
              >
                Администрирование
              </Nav.Link>
            )}
          </Nav>
          
          <Nav>
            <Navbar.Text className="me-3">
              Добро пожаловать, <strong>{user.username}</strong>
              {user.role === 'admin' && (
                <span className="badge bg-primary ms-2">Админ</span>
              )}
            </Navbar.Text>
            <Button variant="outline-secondary" size="sm" onClick={onLogout}>
              Выйти
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;

