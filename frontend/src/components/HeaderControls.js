import React, { useState, useRef } from 'react';
import { productsAPI } from '../api';

const HeaderControls = ({ 
  onSearch, 
  onCategoryFilter, 
  onImport, 
  onExport,
  onAddNew,
  categories = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    onCategoryFilter(value);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const response = await productsAPI.import(file);
      const duplicatesCount = Array.isArray(response.data.duplicates) 
        ? response.data.duplicates.length 
        : response.data.duplicates || 0;
      setImportResult({
        type: 'success',
        message: `Import completed! Added: ${response.data.added}, Skipped: ${response.data.skipped}, Duplicates: ${duplicatesCount}`,
      });
      onImport(response.data);
      setTimeout(() => setImportResult(null), 5000);
    } catch (error) {
      setImportResult({
        type: 'error',
        message: error.response?.data?.error || 'Failed to import CSV file',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await productsAPI.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export CSV file');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="header-controls">
      <div className="controls-row">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="action-buttons">
          <button
            onClick={onAddNew}
            className="btn btn-success"
            title="Add a new product"
          >
            ➕ Add New Product
          </button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="btn btn-primary"
            title="Import products from CSV"
          >
            {importing ? '⏳ Importing...' : '📥 Import CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-secondary"
            title="Export all products to CSV"
          >
            {exporting ? '⏳ Exporting...' : '📤 Export CSV'}
          </button>
        </div>
      </div>

      {importResult && (
        <div
          className={`import-result ${
            importResult.type === 'success' ? 'success' : 'error'
          }`}
        >
          {importResult.message}
          <button
            onClick={() => setImportResult(null)}
            className="close-btn"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderControls;


