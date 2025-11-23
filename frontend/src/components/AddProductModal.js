import React, { useState } from 'react';
import { productsAPI } from '../api';

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    category: '',
    brand: '',
    stock: 0,
    status: 'active',
    image: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.name || !formData.unit || !formData.category || !formData.brand) {
      setError('Please fill in all required fields (Name, Unit, Category, Brand)');
      setSaving(false);
      return;
    }

    try {
      const response = await productsAPI.create({
        ...formData,
        stock: parseInt(formData.stock, 10) || 0,
        changedBy: 'user',
      });

      onAdd(response.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add product');
      console.error('Add product error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      unit: '',
      category: '',
      brand: '',
      stock: 0,
      status: 'active',
      image: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Product</h2>
          <button onClick={handleClose} className="close-btn" title="Close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Unit *</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              placeholder="e.g., piece, kg, box"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="e.g., Electronics, Furniture"
              required
            />
          </div>

          <div className="form-group">
            <label>Brand *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => handleChange('stock', parseInt(e.target.value, 10) || 0)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;

