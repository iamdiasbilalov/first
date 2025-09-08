import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const EmployeeForm = ({ employee, companies, departments, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    departmentId: '',
    companyId: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        position: employee.position || '',
        departmentId: employee.departmentId || '',
        companyId: employee.companyId || '',
        phone: employee.phone || '',
        email: employee.email || ''
      });
    }
  }, [employee]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'ФИО обязательно';
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'ФИО должно содержать минимум 2 символа';
        } else {
          delete newErrors.fullName;
        }
        break;
      case 'position':
        if (!value.trim()) {
          newErrors.position = 'Должность обязательна';
        } else if (value.trim().length < 2) {
          newErrors.position = 'Должность должна содержать минимум 2 символа';
        } else {
          delete newErrors.position;
        }
        break;
      case 'companyId':
        if (!value) {
          newErrors.companyId = 'Компания обязательна';
        } else {
          delete newErrors.companyId;
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Телефон обязателен';
        } else if (!/^\+?[0-9\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone = 'Введите корректный номер телефона';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email обязателен';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Введите корректный email';
        } else {
          delete newErrors.email;
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
      if (key !== 'departmentId') { // departmentId is optional
        validateField(key, formData[key]);
      }
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      if (employee) {
        await axios.put(`/api/employees/${employee.id}`, formData);
      } else {
        await axios.post('/api/employees', formData);
      }
      onSave();
    } catch (error) {
      setServerError(error.response?.data?.message || 'Ошибка при сохранении сотрудника');
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
    <Form onSubmit={handleSubmit}>
      {serverError && (
        <Alert variant="danger" className="mb-3">
          {serverError}
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>ФИО *</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={getValidationClass('fullName')}
              placeholder="Введите ФИО"
            />
            {errors.fullName && (
              <div className="validation-error">{errors.fullName}</div>
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Должность *</Form.Label>
            <Form.Control
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className={getValidationClass('position')}
              placeholder="Введите должность"
            />
            {errors.position && (
              <div className="validation-error">{errors.position}</div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Компания *</Form.Label>
            <Form.Select
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className={getValidationClass('companyId')}
            >
              <option value="">Выберите компанию</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Form.Select>
            {errors.companyId && (
              <div className="validation-error">{errors.companyId}</div>
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Отдел</Form.Label>
            <Form.Select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
            >
              <option value="">Выберите отдел</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Телефон *</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={getValidationClass('phone')}
              placeholder="+7 777 777 77 77"
            />
            {errors.phone && (
              <div className="validation-error">{errors.phone}</div>
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={getValidationClass('email')}
              placeholder="example@company.com"
            />
            {errors.email && (
              <div className="validation-error">{errors.email}</div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={loading || Object.keys(errors).length > 0}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </Form>
  );
};

export default EmployeeForm;

