import React, { useEffect, useState } from 'react';
import { productsAPI } from '../api';

const HistorySidebar = ({ productId, productName, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchHistory();
    } else {
      setHistory([]);
      setError(null);
    }
  }, [isOpen, productId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getHistory(productId);
      setHistory(response.data);
    } catch (err) {
      setError('Failed to load inventory history');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="history-sidebar-overlay" onClick={onClose}>
      <div className="history-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="history-sidebar-header">
          <h2>📊 Inventory History</h2>
          <button onClick={onClose} className="close-btn" title="Close">×</button>
        </div>
        <div className="history-sidebar-content">
          {productName && (
            <div className="history-product-name">
              <strong>Product:</strong> {productName}
            </div>
          )}
          
          {loading && <div className="loading">Loading history...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && history.length === 0 && (
            <div className="empty-history">
              No inventory history available for this product.
            </div>
          )}
          
          {!loading && !error && history.length > 0 && (
            <div className="history-list">
              {history.map((log) => (
                <div key={log.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-date">{formatDate(log.timestamp)}</span>
                    <span className="history-user">{log.changedBy || 'system'}</span>
                  </div>
                  <div className="history-item-body">
                    <span className="stock-change">
                      Stock: <span className="old-stock">{log.oldStock}</span> →{' '}
                      <span className="new-stock">{log.newStock}</span>
                    </span>
                    <span
                      className={`stock-delta ${
                        log.newStock > log.oldStock ? 'positive' : 'negative'
                      }`}
                    >
                      {log.newStock > log.oldStock ? '+' : ''}
                      {log.newStock - log.oldStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar;


