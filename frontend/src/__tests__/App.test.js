import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { productsAPI, authAPI } from '../api';

// Mock the API
jest.mock('../api', () => ({
  productsAPI: {
    getAll: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    import: jest.fn(),
    export: jest.fn(),
    getHistory: jest.fn(),
    create: jest.fn(),
  },
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders login page when user is not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('renders main app when user is authenticated', async () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin' }));

    productsAPI.getAll.mockResolvedValue({
      data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Inventory Management System')).toBeInTheDocument();
    });
  });
});

