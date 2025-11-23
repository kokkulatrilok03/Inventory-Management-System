const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Mock database for testing
const testDbPath = path.join(__dirname, '../test-inventory.db');

// Delete test database if exists
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// We'll need to modify server.js to accept a test database path
// For now, let's create a basic test structure

describe('API Endpoints', () => {
  let token;
  let server;

  beforeAll(async () => {
    // Import server after setting test DB
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    server = require('../server');
  });

  afterAll(async () => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Authentication', () => {
    test('POST /api/auth/login - should login with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      token = response.body.token;
    });

    test('POST /api/auth/login - should fail with invalid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Products API', () => {
    test('GET /api/products - should require authentication', async () => {
      const response = await request(server)
        .get('/api/products');

      expect(response.status).toBe(401);
    });

    test('GET /api/products - should return products with auth', async () => {
      const response = await request(server)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    test('GET /api/products - should support pagination', async () => {
      const response = await request(server)
        .get('/api/products?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });
});

