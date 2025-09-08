import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const AdminPanel = () => {
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Company modal state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companyError, setCompanyError] = useState('');
  
  // Department modal state
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [departmentError, setDepartmentError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [companiesRes, departmentsRes] = await Promise.all([
        axios.get('/api/companies'),
        axios.get('/api/departments')
      ]);
      
      setCompanies(companiesRes.data);
      setDepartments(departmentsRes.data);
    } catch (error) {
      setError('Ошибка при загрузке данных');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Company functions
  const handleAddCompany = async (e) => {
    e.preventDefault();
    
    if (!newCompanyName.trim()) {
      setCompanyError('Название компании обязательно');
      return;
    }

    if (companies.some(c => c.name.toLowerCase() === newCompanyName.toLowerCase())) {
      setCompanyError('Компания с таким названием уже существует');
      return;
    }

    try {
      await axios.post('/api/companies', { name: newCompanyName.trim() });
      setNewCompanyName('');
      setCompanyError('');
      setShowCompanyModal(false);
      fetchData();
    } catch (error) {
      setCompanyError(error.response?.data?.message || 'Ошибка при добавлении компании');
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (window.confirm(`Вы уверены, что хотите удалить компанию "${companyName}"? Все сотрудники этой компании также будут удалены.`)) {
      try {
        await axios.delete(`/api/companies/${companyId}`);
        fetchData();
      } catch (error) {
        setError('Ошибка при удалении компании');
        console.error('Error deleting company:', error);
      }
    }
  };

  // Department functions
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    
    if (!newDepartmentName.trim()) {
      setDepartmentError('Название отдела обязательно');
      return;
    }

    if (departments.some(d => d.name.toLowerCase() === newDepartmentName.toLowerCase())) {
      setDepartmentError('Отдел с таким названием уже существует');
      return;
    }

    try {
      await axios.post('/api/departments', { name: newDepartmentName.trim() });
      setNewDepartmentName('');
      setDepartmentError('');
      setShowDepartmentModal(false);
      fetchData();
    } catch (error) {
      setDepartmentError(error.response?.data?.message || 'Ошибка при добавлении отдела');
    }
  };

  const handleDeleteDepartment = async (departmentId, departmentName) => {
    if (window.confirm(`Вы уверены, что хотите удалить отдел "${departmentName}"?`)) {
      try {
        await axios.delete(`/api/departments/${departmentId}`);
        fetchData();
      } catch (error) {
        setError('Ошибка при удалении отдела');
        console.error('Error deleting department:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container className="py-4">
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <h1 className="mb-4">🔧 Панель администратора</h1>
        </Col>
      </Row>

      <Row>
        {/* Companies Section */}
        <Col md={6}>
          <div className="admin-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>🏢 Компании</h3>
              <Button variant="primary" onClick={() => setShowCompanyModal(true)}>
                ➕ Добавить компанию
              </Button>
            </div>
            
            {companies.length === 0 ? (
              <p className="text-muted">Нет компаний</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(company => (
                    <tr key={company.id}>
                      <td className="fw-bold">{company.name}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Col>

        {/* Departments Section */}
        <Col md={6}>
          <div className="admin-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>🏛️ Отделы</h3>
              <Button variant="primary" onClick={() => setShowDepartmentModal(true)}>
                ➕ Добавить отдел
              </Button>
            </div>
            
            {departments.length === 0 ? (
              <p className="text-muted">Нет отделов</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(department => (
                    <tr key={department.id}>
                      <td className="fw-bold">{department.name}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteDepartment(department.id, department.name)}
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Col>
      </Row>

      {/* Add Company Modal */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить компанию</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddCompany}>
            {companyError && (
              <Alert variant="danger" className="mb-3">
                {companyError}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Название компании</Form.Label>
              <Form.Control
                type="text"
                value={newCompanyName}
                onChange={(e) => {
                  setNewCompanyName(e.target.value);
                  setCompanyError('');
                }}
                placeholder="Введите название компании"
                autoFocus
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>
                Отмена
              </Button>
              <Button variant="primary" type="submit">
                Добавить
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Department Modal */}
      <Modal show={showDepartmentModal} onHide={() => setShowDepartmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить отдел</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddDepartment}>
            {departmentError && (
              <Alert variant="danger" className="mb-3">
                {departmentError}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Название отдела</Form.Label>
              <Form.Control
                type="text"
                value={newDepartmentName}
                onChange={(e) => {
                  setNewDepartmentName(e.target.value);
                  setDepartmentError('');
                }}
                placeholder="Введите название отдела"
                autoFocus
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowDepartmentModal(false)}>
                Отмена
              </Button>
              <Button variant="primary" type="submit">
                Добавить
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminPanel;

