import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
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
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'Имя пользователя может содержать только буквы, цифры и знак подчеркивания';
        } else {
          delete newErrors.username;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Пароль обязателен';
        } else if (value.length < 6) {
          newErrors.password = 'Пароль должен содержать минимум 6 символов';
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
          newErrors.password = 'Пароль должен содержать как минимум одну букву и одну цифру';
        } else {
          delete newErrors.password;
        }
        
        // Re-validate confirm password if it exists
        if (formData.confirmPassword) {
          if (value !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Подтверждение пароля обязательно';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Пароли не совпадают';
        } else {
          delete newErrors.confirmPassword;
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
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        password: formData.password
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      onLogin(user);
    } catch (error) {
      setServerError(error.response?.data?.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const getValidationClass = (fieldName) => {
    if (formData[fieldName] && !errors[fieldName]) {
      return 'is-valid';
    } else if (errors[fieldName]) {
      return 'is-invalid';
    }
    return '';
  };

  return (
    <div className="auth-container">
      <Container>
        <Card className="auth-card">
          <Card.Body>
            <div className="text-center mb-4">
              <h2 className="mb-3">Регистрация</h2>
              <p className="text-muted">Создать новый аккаунт</p>
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
                  className={getValidationClass('username')}
                  placeholder="Введите имя пользователя"
                />
                {errors.username && (
                  <div className="validation-error">{errors.username}</div>
                )}
                {formData.username && !errors.username && (
                  <div className="validation-success">✓ Имя пользователя корректно</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Пароль</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={getValidationClass('password')}
                  placeholder="Введите пароль"
                />
                {errors.password && (
                  <div className="validation-error">{errors.password}</div>
                )}
                {formData.password && !errors.password && (
                  <div className="validation-success">✓ Пароль корректен</div>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Подтверждение пароля</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={getValidationClass('confirmPassword')}
                  placeholder="Повторите пароль"
                />
                {errors.confirmPassword && (
                  <div className="validation-error">{errors.confirmPassword}</div>
                )}
                {formData.confirmPassword && !errors.confirmPassword && (
                  <div className="validation-success">✓ Пароли совпадают</div>
                )}
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mb-3"
                disabled={loading || Object.keys(errors).length > 0 || !formData.username || !formData.password || !formData.confirmPassword}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </Form>

            <div className="text-center">
              <p className="mb-0">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-decoration-none">
                  Войти
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Register;

