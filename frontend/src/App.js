import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './components/Login';
import HeaderControls from './components/HeaderControls';
import ProductTable from './components/ProductTable';
import HistorySidebar from './components/HistorySidebar';
import AddProductModal from './components/AddProductModal';
import { productsAPI } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [historyProductId, setHistoryProductId] = useState(null);
  const [historyProductName, setHistoryProductName] = useState(null);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (searchTerm) {
        response = await productsAPI.search(searchTerm);
      } else {
        response = await productsAPI.getAll({
          category: selectedCategory || undefined,
        });
      }
      
      let fetchedProducts = response.data.data || response.data;
      
      if (searchTerm && selectedCategory) {
        fetchedProducts = fetchedProducts.filter((p) => p.category === selectedCategory);
      }
      
      setProducts(fetchedProducts);
      
      const uniqueCategories = [
        ...new Set(fetchedProducts.map((p) => p.category).filter(Boolean)),
      ].sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    fetchProducts();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const handleImport = (result) => {
    fetchProducts();
    toast.success(`Import completed! Added: ${result.added}, Skipped: ${result.skipped}, Duplicates: ${result.duplicates?.length || 0}`);
  };

  const handleUpdate = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    toast.success('Product updated successfully');
  };

  const handleDelete = async (deletedId) => {
    try {
      setProducts((prev) => prev.filter((p) => p.id !== deletedId));
      if (historyProductId === deletedId) {
        setHistorySidebarOpen(false);
        setHistoryProductId(null);
        setHistoryProductName(null);
      }
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleViewHistory = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setHistoryProductId(productId);
      setHistoryProductName(product.name);
      setHistorySidebarOpen(true);
    }
  };

  const handleCloseHistory = () => {
    setHistorySidebarOpen(false);
    setHistoryProductId(null);
    setHistoryProductName(null);
  };

  const handleAddProduct = (newProduct) => {
    setProducts((prev) => [...prev, newProduct]);
    fetchProducts();
    toast.success('Product added successfully');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <header className="app-header">
        <h1>📦 Inventory Management System</h1>
        <div className="user-info">
          <span style={{ fontSize: '0.95rem', opacity: 0.9 }}>👤 Welcome, <strong>{user.username}</strong></span>
          <button onClick={handleLogout} className="btn-logout" title="Logout">🚪 Logout</button>
        </div>
      </header>

      <main className="app-main">
        <HeaderControls
          onSearch={handleSearch}
          onCategoryFilter={handleCategoryFilter}
          onImport={handleImport}
          onExport={() => {}}
          onAddNew={() => setAddProductModalOpen(true)}
          categories={categories}
        />

        {loading ? (
          <div className="loading-container">
            <p style={{ marginTop: '1rem', fontSize: '1rem', color: '#64748b' }}>Loading products...</p>
          </div>
        ) : (
          <ProductTable
            products={filteredProducts}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onViewHistory={handleViewHistory}
          />
        )}
      </main>

      <HistorySidebar
        productId={historyProductId}
        productName={historyProductName}
        isOpen={historySidebarOpen}
        onClose={handleCloseHistory}
      />

      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        onAdd={handleAddProduct}
      />
    </div>
  );
}

export default App;


