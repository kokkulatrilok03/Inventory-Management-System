import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductTable from '../components/ProductTable';
import { productsAPI } from '../api';

jest.mock('../api');

const mockProducts = [
  {
    id: 1,
    name: 'Laptop',
    unit: 'piece',
    category: 'Electronics',
    brand: 'Dell',
    stock: 10,
    status: 'active',
    image: 'https://example.com/laptop.jpg'
  },
  {
    id: 2,
    name: 'Mouse',
    unit: 'piece',
    category: 'Electronics',
    brand: 'Logitech',
    stock: 0,
    status: 'active',
    image: null
  }
];

describe('ProductTable Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnViewHistory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders products table', () => {
    render(
      <ProductTable
        products={mockProducts}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onViewHistory={mockOnViewHistory}
      />
    );

    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Mouse')).toBeInTheDocument();
  });

  test('shows edit mode when edit button is clicked', () => {
    render(
      <ProductTable
        products={mockProducts}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onViewHistory={mockOnViewHistory}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('calls onDelete when delete button is clicked', () => {
    window.confirm = jest.fn(() => true);
    productsAPI.delete.mockResolvedValue({});

    render(
      <ProductTable
        products={mockProducts}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onViewHistory={mockOnViewHistory}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
  });
});

