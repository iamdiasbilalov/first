import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = 'Имя пользователя обязательно';
        } else if (value.length < 3) {
          newErrors.username = 'Имя пользователя должно содержать минимум 3 символа';
        } else {
          delete newErrors.username;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Пароль обязателен';
        } else if (value.length < 6) {
          newErrors.password = 'Пароль должен содержать минимум 6 символов';
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const response = await axios.post('/api/auth/login', formData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      onLogin(user);
    } catch (error) {
      setServerError(error.response?.data?.message || 'Ошибка при входе в систему');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Container className="d-flex justify-content-center align-items-center">
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <h2 className="mb-3">Вход в систему</h2>
              <p className="text-muted">Телефонный справочник компании</p>
            </div>

            {serverError && (
              <Alert variant="danger" className="mb-3">
                {serverError}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Имя пользователя</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  isInvalid={!!errors.username}
                  placeholder="Введите имя пользователя"
                />
                {errors.username && (
                  <div className="validation-error">{errors.username}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Пароль</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                  placeholder="Введите пароль"
                />
                {errors.password && (
                  <div className="validation-error">{errors.password}</div>
                )}
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mb-3"
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </Form>

            <div className="text-center">
              <p className="mb-0">
                Нет аккаунта?{' '}
                <Link to="/register" className="text-decoration-none">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Login;

