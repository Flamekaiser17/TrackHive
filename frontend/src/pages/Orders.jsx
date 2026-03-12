import React from 'react';
import { Package, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getOrders } from '../api/endpoints';

const Orders = () => {
  // FIXED: BUG 2 - initialized as array
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // FIXED: BUG 2 - Wrap API call in try/catch/finally
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrders();
        // Handle paginated response
        setOrders(data?.results || data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors = {
    'CREATED': 'var(--accent-blue)',
    'ASSIGNED': 'var(--primary)',
    'IN TRANSIT': 'var(--accent-amber)',
    'DELIVERED': 'var(--accent-green)',
    'PICKED UP': 'var(--primary)',
  };

  const getStatusBadge = (status) => (
    <div style={{ 
      padding: '4px 10px', 
      background: `${statusColors[status] || 'gray'}15`, 
      border: `1px solid ${statusColors[status] || 'gray'}40`,
      borderRadius: '100px',
      display: 'inline-flex', alignItems: 'center', gap: '6px'
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColors[status] || 'gray' }} />
      <span style={{ fontSize: '10px', fontWeight: '800', color: statusColors[status] || 'gray' }}>{status}</span>
    </div>
  );

  // FIXED: BUG 2 - loading skeleton
  if (loading) return (
    <div className="orders-loading" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton-row" style={{ height: '60px', background: 'var(--surface)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  return (
    <div className="dashboard-grid">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Active Deliveries</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Monitoring {(orders || []).length} orders across Bengaluru district</p>
         </div>
      </header>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
         {error && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               <AlertCircle size={20} />
               <span style={{ fontWeight: '600' }}>{error}</span>
            </div>
         )}
         
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ORDER ID</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>CUSTOMER</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>STATUS / ETA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>CREATED</th>
               </tr>
            </thead>
            <tbody>
               {(orders || []).map((order) => (
                 <React.Fragment key={order.id}>
                   <tr 
                     onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                     style={{ 
                       borderBottom: '1px solid var(--border)', 
                       cursor: 'pointer',
                       background: expandedId === order.id ? 'var(--surface-hover)' : 'transparent',
                       transition: 'all 0.2s ease'
                     }}
                   >
                     <td style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '700' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <Package size={14} color="var(--primary)" />
                         <span className="mono">#OR-{order.id}</span>
                       </div>
                     </td>
                     <td style={{ padding: '18px 24px', fontSize: '13px' }}>Customer_{order.id}</td>
                     <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                           {getStatusBadge((order.status || 'CREATED').toUpperCase().replace('_', ' '))}
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)' }}>
                              <Clock size={12} />
                              <span className="mono" style={{ fontSize: '12px', fontWeight: '700' }}>{order.eta_minutes || Math.floor(Math.random() * 25)}m</span>
                           </div>
                        </div>
                     </td>
                     <td style={{ padding: '18px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>12:34 PM</td>
                   </tr>
                 </React.Fragment>
               ))}
               {(!loading && !error && (orders || []).length === 0) && (
                 <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No active orders found</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Orders;
