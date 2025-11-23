import React, { useState } from 'react';
import { productsAPI } from '../api';

const ProductTable = ({ products, onUpdate, onDelete, onViewHistory }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      unit: product.unit,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      status: product.status,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id) => {
    try {
      const { image, ...updateData } = editData;
      const response = await productsAPI.update(id, {
        ...updateData,
        changedBy: 'user',
      });
      onUpdate(response.data);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update product');
      console.error('Update error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeletingId(id);
    try {
      await productsAPI.delete(id);
      onDelete(id);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete product');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found. Import a CSV file to get started.</p>
      </div>
    );
  }

  return (
    <div className="product-table-container">
      <table className="product-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={`product-${product.id}`}
              onClick={() => onViewHistory(product.id)}
              className="product-row"
              data-product-id={product.id}
            >
              <td>
                <div className="product-image">
                  {product.image ? (
                    <img
                      key={`img-${product.id}-${product.image}`}
                      src={product.image}
                      alt={`${product.name} product image`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          let placeholder = parent.querySelector('.image-placeholder');
                          if (!placeholder) {
                            placeholder = document.createElement('div');
                            placeholder.className = 'image-placeholder';
                            placeholder.textContent = 'No Image';
                            parent.appendChild(placeholder);
                          }
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : (
                    <div className="image-placeholder">No Image</div>
                  )}
                </div>
              </td>
              <td>
                {editingId === product.id ? (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.name}</span>
                )}
              </td>
              <td>
                {editingId === product.id ? (
                  <input
                    type="text"
                    value={editData.unit || ''}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.unit}</span>
                )}
              </td>
              <td>
                {editingId === product.id ? (
                  <input
                    type="text"
                    value={editData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.category}</span>
                )}
              </td>
              <td>
                {editingId === product.id ? (
                  <input
                    type="text"
                    value={editData.brand || ''}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.brand}</span>
                )}
              </td>
              <td>
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={editData.stock || 0}
                    onChange={(e) =>
                      handleChange('stock', parseInt(e.target.value, 10) || 0)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="edit-input"
                    min="0"
                  />
                ) : (
                  <span className={`stock-status stock-${product.stock > 0 ? 'available' : 'out'}`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                )}
              </td>
              <td>
                {editingId === product.id ? (
                  <select
                    value={editData.status || 'active'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                ) : (
                  <span className={`status-badge status-${product.status}`}>
                    {product.status}
                  </span>
                )}
              </td>
              <td onClick={(e) => e.stopPropagation()} className="actions-cell">
                <div className="action-buttons-inline">
                  {editingId === product.id ? (
                    <>
                      <button
                        onClick={() => handleSave(product.id)}
                        className="btn-save"
                        type="button"
                      >
                        Save
                      </button>
                      <button 
                        onClick={handleCancel} 
                        className="btn-cancel"
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="btn-edit"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                        disabled={deletingId === product.id}
                        className="btn-delete"
                        type="button"
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;


