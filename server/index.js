const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_PATH = path.join(__dirname, '../database/data.json');

// Helper functions to read/write database
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { companies: [], departments: [], users: [], employees: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Routes

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  
  const user = db.users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const db = readDB();
  
  const existingUser = db.users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    role: 'user'
  };

  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

// Companies routes
app.get('/api/companies', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.companies);
});

app.post('/api/companies', authenticateToken, requireAdmin, (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  const db = readDB();
  const newCompany = {
    id: uuidv4(),
    name
  };

  db.companies.push(newCompany);
  writeDB(db);
  res.json(newCompany);
});

app.delete('/api/companies/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  
  db.companies = db.companies.filter(c => c.id !== id);
  // Also remove employees from deleted company
  db.employees = db.employees.filter(e => e.companyId !== id);
  
  writeDB(db);
  res.json({ message: 'Company deleted successfully' });
});

// Departments routes
app.get('/api/departments', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.departments);
});

app.post('/api/departments', authenticateToken, requireAdmin, (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  const db = readDB();
  const newDepartment = {
    id: uuidv4(),
    name
  };

  db.departments.push(newDepartment);
  writeDB(db);
  res.json(newDepartment);
});

app.delete('/api/departments/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  
  db.departments = db.departments.filter(d => d.id !== id);
  // Update employees who had this department
  db.employees = db.employees.map(e => 
    e.departmentId === id ? { ...e, departmentId: null } : e
  );
  
  writeDB(db);
  res.json({ message: 'Department deleted successfully' });
});

// Employees routes
app.get('/api/employees', authenticateToken, (req, res) => {
  const { companyId, search } = req.query;
  const db = readDB();
  
  let employees = db.employees;
  
  if (companyId) {
    employees = employees.filter(e => e.companyId === companyId);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    employees = employees.filter(e => 
      e.fullName.toLowerCase().includes(searchLower) ||
      e.phone.includes(search) ||
      (e.departmentId && db.departments.find(d => d.id === e.departmentId)?.name.toLowerCase().includes(searchLower))
    );
  }
  
  // Enrich with company and department names
  employees = employees.map(e => ({
    ...e,
    companyName: db.companies.find(c => c.id === e.companyId)?.name || '',
    departmentName: db.departments.find(d => d.id === e.departmentId)?.name || ''
  }));
  
  res.json(employees);
});

app.post('/api/employees', authenticateToken, requireAdmin, (req, res) => {
  const { fullName, position, departmentId, companyId, phone, email } = req.body;
  
  if (!fullName || !position || !companyId || !phone || !email) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const db = readDB();
  const newEmployee = {
    id: uuidv4(),
    fullName,
    position,
    departmentId,
    companyId,
    phone,
    email
  };

  db.employees.push(newEmployee);
  writeDB(db);
  res.json(newEmployee);
});

app.put('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { fullName, position, departmentId, companyId, phone, email } = req.body;
  
  const db = readDB();
  const employeeIndex = db.employees.findIndex(e => e.id === id);
  
  if (employeeIndex === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  db.employees[employeeIndex] = {
    id,
    fullName,
    position,
    departmentId,
    companyId,
    phone,
    email
  };

  writeDB(db);
  res.json(db.employees[employeeIndex]);
});

app.delete('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  
  db.employees = db.employees.filter(e => e.id !== id);
  writeDB(db);
  res.json({ message: 'Employee deleted successfully' });
});

// Export route
app.get('/api/employees/export', authenticateToken, (req, res) => {
  const { companyId } = req.query;
  const db = readDB();
  
  let employees = db.employees;
  
  if (companyId) {
    employees = employees.filter(e => e.companyId === companyId);
  }
  
  // Enrich with company and department names
  employees = employees.map(e => ({
    'ФИО': e.fullName,
    'Должность': e.position,
    'Отдел': db.departments.find(d => d.id === e.departmentId)?.name || 'Не указан',
    'Компания': db.companies.find(c => c.id === e.companyId)?.name || 'Не указана',
    'Телефон': e.phone,
    'Email': e.email
  }));
  
  // Создаем рабочий лист
  const worksheet = XLSX.utils.json_to_sheet(employees);
  
  // Настраиваем ширину колонок
  const columnWidths = [
    { wch: 25 }, // ФИО
    { wch: 20 }, // Должность
    { wch: 15 }, // Отдел
    { wch: 18 }, // Компания
    { wch: 18 }, // Телефон
    { wch: 30 }  // Email
  ];
  worksheet['!cols'] = columnWidths;
  
  // Добавляем заголовок таблицы
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center" }
  };
  
  // Применяем стили к заголовкам (первая строка)
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = headerStyle;
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Сотрудники');
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  // Генерируем имя файла с датой
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const companyName = companyId ? db.companies.find(c => c.id === companyId)?.name || 'Компания' : 'Все_компании';
  const fileName = `Сотрудники_${companyName}_${currentDate}.xlsx`;
  
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

