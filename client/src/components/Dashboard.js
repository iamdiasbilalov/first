import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Modal, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import EmployeeForm from './EmployeeForm';

const Dashboard = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

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
      
      // Устанавливаем пустое значение для показа всех компаний по умолчанию
      setSelectedCompany('');
    } catch (error) {
      setError('Ошибка при загрузке данных');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const params = {};
      if (selectedCompany) params.companyId = selectedCompany;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get('/api/employees', { params });
      setEmployees(response.data);
    } catch (error) {
      setError('Ошибка при загрузке сотрудников');
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    if (companies.length > 0) {
      fetchEmployees();
    }
  }, [selectedCompany, searchQuery, companies]);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await axios.delete(`/api/employees/${employeeId}`);
        fetchEmployees();
      } catch (error) {
        setError('Ошибка при удалении сотрудника');
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleEmployeeSaved = () => {
    setShowEmployeeModal(false);
    fetchEmployees();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = selectedCompany ? { companyId: selectedCompany } : {};
      const response = await axios.get('/api/employees/export', {
        params,
        responseType: 'blob'
      });
      
      // Получаем имя файла из заголовков ответа
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'employees.xlsx';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Ошибка при экспорте данных');
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  const selectedCompanyName = companies.find(c => c.id === selectedCompany)?.name || '';

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
          <h1 className="mb-4">Справочник сотрудников</h1>
        </Col>
      </Row>

      {/* Company Selector */}
      <div className="company-selector">
        <Row className="align-items-center">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-bold">Выберите компанию:</Form.Label>
              <Form.Select
                value={selectedCompany}
                onChange={handleCompanyChange}
                size="lg"
              >
                <option value="">Все компании</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-bold">Поиск:</Form.Label>
              <Form.Control
                type="text"
                placeholder="ФИО, телефон или отдел..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="lg"
              />
            </Form.Group>
          </Col>
          <Col md={4} className="d-flex align-items-end gap-2">
            {user.role === 'admin' && (
              <Button variant="primary" onClick={handleAddEmployee}>
                ➕ Добавить сотрудника
              </Button>
            )}
            <Button 
              variant="success" 
              className="export-btn" 
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Экспорт...
                </>
              ) : (
                <>📊 Экспорт в Excel</>
              )}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Employees List */}
      <div className="mb-3">
        <h3>
          {selectedCompany 
            ? `Сотрудники компании: ${selectedCompanyName}` 
            : 'Все сотрудники'
          }
        </h3>
        <p className="text-muted">Найдено сотрудников: {employees.length}</p>
      </div>

      {employees.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h5>Сотрудники не найдены</h5>
            <p className="text-muted">
              {selectedCompany ? 'В выбранной компании нет сотрудников' : 'Нет сотрудников в базе данных'}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Должность</th>
                <th>Отдел</th>
                <th>Телефон</th>
                <th>Email</th>
                {user.role === 'admin' && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id}>
                  <td className="fw-bold">{employee.fullName}</td>
                  <td>{employee.position}</td>
                  <td>{employee.departmentName}</td>
                  <td>{employee.phone}</td>
                  <td>{employee.email}</td>
                  {user.role === 'admin' && (
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <Modal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <EmployeeForm
              employee={editingEmployee}
              companies={companies}
              departments={departments}
              onSave={handleEmployeeSaved}
              onCancel={() => setShowEmployeeModal(false)}
            />
          </Modal.Body>
        </Modal>
      )}
    </Container>
  );
};

export default Dashboard;

