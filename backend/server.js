const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { body, validationResult, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'https://inventory-management-system-tveg.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static('uploads'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// API Logging Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  
  // Log query parameters if any
  if (Object.keys(req.query).length > 0) {
    console.log(`  Query:`, req.query);
  }
  
  // Log request body (excluding file uploads)
  if (req.body && Object.keys(req.body).length > 0 && !req.file) {
    // Don't log sensitive data or very large payloads
    const bodyToLog = { ...req.body };
    if (bodyToLog.image && bodyToLog.image.length > 100) {
      bodyToLog.image = bodyToLog.image.substring(0, 100) + '...';
    }
    console.log(`  Body:`, JSON.stringify(bodyToLog, null, 2));
  }
  
  // Log file upload info
  if (req.file) {
    console.log(`  File: ${req.file.originalname} (${req.file.size} bytes)`);
  }
  
  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)\n`);
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)\n`);
    return originalJson.call(this, data);
  };
  
  next();
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const dbPath = path.join(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      image TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      oldStock INTEGER NOT NULL,
      newStock INTEGER NOT NULL,
      changedBy TEXT DEFAULT 'system',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products(LOWER(name))`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);

    // Create users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create default admin user if not exists
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, existingUser) => {
      if (err) {
        console.error('Error checking for existing admin user:', err);
        return;
      }
      
      if (!existingUser) {
        const defaultPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, 
          ['admin', defaultPassword], (err) => {
            if (err) {
              console.error('Error creating default user:', err);
            } else {
              console.log('✅ Default admin user created (username: admin, password: admin123)');
            }
          });
      } else {
        console.log('✅ Admin user already exists');
      }
    });
  });
}

function getProducts(filters = {}, pagination = {}, sorting = {}, callback) {
  let query = 'SELECT * FROM products WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
  const params = [];
  const countParams = [];

  // Filtering
  if (filters.name) {
    query += ' AND LOWER(name) LIKE ?';
    countQuery += ' AND LOWER(name) LIKE ?';
    const nameParam = `%${filters.name.toLowerCase()}%`;
    params.push(nameParam);
    countParams.push(nameParam);
  }

  if (filters.category) {
    query += ' AND category = ?';
    countQuery += ' AND category = ?';
    params.push(filters.category);
    countParams.push(filters.category);
  }

  if (filters.brand) {
    query += ' AND brand = ?';
    countQuery += ' AND brand = ?';
    params.push(filters.brand);
    countParams.push(filters.brand);
  }

  if (filters.status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(filters.status);
    countParams.push(filters.status);
  }

  // Sorting
  const validSortFields = ['name', 'category', 'brand', 'stock', 'status', 'createdAt', 'updatedAt'];
  const sortField = validSortFields.includes(sorting.field) ? sorting.field : 'name';
  const sortOrder = sorting.order && sorting.order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${sortField} ${sortOrder}`;

  // Pagination
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // Get total count
  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      return callback(err, null);
    }

    const total = countResult ? countResult.total : 0;

    // Get paginated results
    db.all(query, params, (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, {
          data: rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    });
  });
}

function checkDuplicateName(name, excludeId = null, callback) {
  let query = 'SELECT id FROM products WHERE LOWER(name) = LOWER(?)';
  const params = [name];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  db.get(query, params, (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      // Return the existing product ID if duplicate found, false otherwise
      callback(null, row ? row.id : false);
    }
  });
}

function logInventoryChange(productId, oldStock, newStock, changedBy = 'system') {
  if (oldStock !== newStock) {
    db.run(
      'INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy) VALUES (?, ?, ?, ?)',
      [productId, oldStock, newStock, changedBy],
      (err) => {
        if (err) {
          console.error('Error logging inventory change:', err);
        }
      }
    );
  }
}

app.get('/api/products', [
  query('name').optional().trim(),
  query('category').optional().trim(),
  query('brand').optional().trim(),
  query('status').optional().isIn(['active', 'inactive']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().trim(),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const filters = {
    name: req.query.name,
    category: req.query.category,
    brand: req.query.brand,
    status: req.query.status
  };

  const pagination = {
    page: req.query.page,
    limit: req.query.limit
  };

  const sorting = {
    field: req.query.sortBy,
    order: req.query.sortOrder
  };

  getProducts(filters, pagination, sorting, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(result);
  });
});

app.get('/api/products/search', [
  query('name').notEmpty().trim().withMessage('Name parameter is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  getProducts({ name: req.query.name }, {}, {}, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to search products' });
    }
    // Return data array for backward compatibility with search endpoint
    const products = result.data || result;
    res.json(products);
  });
});

app.post('/api/products', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, unit, category, brand, stock = 0, status = 'active', image = null } = req.body;

  checkDuplicateName(name, null, (err, existingId) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to check duplicate name' });
    }
    if (existingId) {
      return res.status(400).json({ error: 'Product name already exists' });
    }

    db.run(
      `INSERT INTO products (name, unit, category, brand, stock, status, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, unit, category, brand, stock, status, image],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create product', details: err.message });
        }

        if (stock > 0) {
          logInventoryChange(this.lastID, 0, stock, req.body.changedBy || 'user');
        }

        db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, product) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch created product' });
          }
          res.status(201).json(product);
        });
      }
    );
  });
});

app.post('/api/products/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const results = {
    added: 0,
    skipped: 0,
    duplicates: []
  };

  const products = [];
  const errors = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      products.push({
        name: row.name || row.Name || '',
        unit: row.unit || row.Unit || '',
        category: row.category || row.Category || '',
        brand: row.brand || row.Brand || '',
        stock: parseInt(row.stock || row.Stock || 0, 10) || 0,
        status: (row.status || row.Status || 'active').toLowerCase(),
        image: row.image || row.Image || null
      });
    })
    .on('end', () => {
      let processed = 0;
      
      if (products.length === 0) {
        fs.unlinkSync(filePath);
        return res.json(results);
      }

      products.forEach((product) => {
        if (!product.name || !product.unit || !product.category || !product.brand) {
          results.skipped++;
          processed++;
          if (processed === products.length) {
            fs.unlinkSync(filePath);
            res.json(results);
          }
          return;
        }

        checkDuplicateName(product.name, null, (err, existingId) => {
          if (err) {
            errors.push({ product: product.name, error: err.message });
            results.skipped++;
          } else if (existingId) {
            // Add duplicate with name and existingId
            results.duplicates.push({
              name: product.name,
              existingId: existingId
            });
          } else {
            db.run(
              `INSERT INTO products (name, unit, category, brand, stock, status, image) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [product.name, product.unit, product.category, product.brand, 
               product.stock, product.status, product.image],
              function(err) {
                if (err) {
                  errors.push({ product: product.name, error: err.message });
                  results.skipped++;
                } else {
                  results.added++;
                  if (product.stock > 0) {
                    logInventoryChange(this.lastID, 0, product.stock, 'csv-import');
                  }
                }
              }
            );
          }

          processed++;
          if (processed === products.length) {
            fs.unlinkSync(filePath);
            if (errors.length > 0) {
              console.error('Import errors:', errors);
            }
            res.json(results);
          }
        });
      });
    })
    .on('error', (err) => {
      fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Error parsing CSV file', details: err.message });
    });
});

app.get('/api/products/export', (req, res) => {
  getProducts({}, {}, {}, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to export products' });
    }
    const products = result.data || result;

    const headers = ['name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    let csvContent = headers.join(',') + '\n';

    products.forEach((product) => {
      const row = [
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.unit || '').replace(/"/g, '""')}"`,
        `"${(product.category || '').replace(/"/g, '""')}"`,
        `"${(product.brand || '').replace(/"/g, '""')}"`,
        product.stock || 0,
        product.status || 'active',
        `"${(product.image || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products-export.csv');
    res.send(csvContent);
  });
});

app.put('/api/products/:id', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, currentProduct) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.body.name && req.body.name.toLowerCase() !== currentProduct.name.toLowerCase()) {
      checkDuplicateName(req.body.name, productId, (err, existingId) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to check duplicate name' });
        }
        if (existingId) {
          return res.status(400).json({ error: 'Product name already exists' });
        }
        updateProduct();
      });
    } else {
      updateProduct();
    }

    function updateProduct() {
      const updates = [];
      const values = [];

      Object.keys(req.body).forEach((key) => {
        if (['name', 'unit', 'category', 'brand', 'stock', 'status', 'image'].includes(key)) {
          updates.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(productId);

      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, values, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update product', details: err.message });
        }

        const newStock = req.body.stock !== undefined ? parseInt(req.body.stock, 10) : currentProduct.stock;
        if (newStock !== currentProduct.stock) {
          logInventoryChange(productId, currentProduct.stock, newStock, req.body.changedBy || 'user');
        }

        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, updatedProduct) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch updated product' });
          }
          res.json(updatedProduct);
        });
      });
    }
  });
});

app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', id: productId });
  });
});

app.get('/api/products/:id/history', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  db.all(
    'SELECT * FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC',
    [productId],
    (err, logs) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch inventory history' });
      }
      res.json(logs);
    }
  );
});

// Authentication routes
app.post('/api/auth/register', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (user) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, hashedPassword], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
        res.status(201).json({ message: 'User created successfully' });
      });
  });
});

app.post('/api/auth/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      console.log(`Login attempt failed: User '${username}' not found`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      console.log(`Login attempt failed: Invalid password for user '${username}'`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`User '${username}' logged in successfully`);
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

// Protect all product routes (apply after auth routes are defined)
app.use('/api/products', authenticateToken);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
