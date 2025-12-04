import React, { useState, useEffect } from 'react';
import { Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { orderAPI } from '../services/api';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        selectedDate: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        hasNext: false,
        hasPrev: false
    });
    const [downloading, setDownloading] = useState(false);

    // Define status tabs
    const statusTabs = [
        { key: '', label: 'All Orders', color: 'primary' },
        { key: 'pending', label: 'Pending', color: 'warning' },
        { key: 'processing', label: 'Processing', color: 'info' },
        { key: 'shipped', label: 'Shipped', color: 'secondary' },
        { key: 'delivered', label: 'Delivered', color: 'success' },
        { key: 'cancelled', label: 'Cancelled', color: 'danger' }
    ];

    // Stats for each status
    const [statusStats, setStatusStats] = useState({
        all: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    });

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    // Fetch status statistics on initial load
    useEffect(() => {
        fetchStatusStats();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            // Prepare query parameters
            const queryParams = {
                status: filters.status,
                page: filters.page,
                limit: filters.limit
            };

            // Add date filter if selected
            if (filters.selectedDate) {
                const selectedDate = new Date(filters.selectedDate);
                selectedDate.setHours(0, 0, 0, 0);
                queryParams.startDate = selectedDate.toISOString();

                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                queryParams.endDate = nextDay.toISOString();
            }

            console.log('Query params being sent:', queryParams);

            const response = await orderAPI.getAll(queryParams);
            setOrders(response.data.orders);

            // Update pagination info from API response
            if (response.data.pagination) {
                setPagination({
                    currentPage: response.data.pagination.currentPage,
                    totalPages: response.data.pagination.totalPages,
                    totalOrders: response.data.pagination.totalOrders,
                    hasNext: response.data.pagination.hasNext,
                    hasPrev: response.data.pagination.hasPrev
                });
            }
        } catch (err) {
            setError('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusStats = async () => {
        try {
            // You might need to create a separate API endpoint for this
            // or modify your existing endpoint to return counts
            const response = await orderAPI.getAll({ limit: 1 }); // Just to get total count
            if (response.data.pagination) {
                setStatusStats(prev => ({
                    ...prev,
                    all: response.data.pagination.totalOrders
                }));
            }

            // Fetch counts for each status
            // This is a simplified approach - you might want to optimize this
            const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            for (const status of statuses) {
                const res = await orderAPI.getAll({ status, limit: 1 });
                if (res.data.pagination) {
                    setStatusStats(prev => ({
                        ...prev,
                        [status]: res.data.pagination.totalOrders
                    }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch status stats:', err);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderAPI.update(orderId, { status: newStatus });
            fetchOrders();
            fetchStatusStats(); // Refresh stats after update
            if (selectedOrder && selectedOrder._id === orderId) {
                const response = await orderAPI.getOne(orderId);
                setSelectedOrder(response.data.order);
            }
        } catch (err) {
            setError('Failed to update order status');
        }
    };

    const handleViewDetails = async (order) => {
        try {
            const response = await orderAPI.getOne(order._id);
            setSelectedOrder(response.data.order);
            setShowModal(true);
        } catch (err) {
            setError('Failed to fetch order details');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await orderAPI.delete(id);
                fetchOrders();
                fetchStatusStats(); // Refresh stats after delete
            } catch (err) {
                setError('Failed to delete order');
            }
        }
    };

    // Download orders as CSV/Excel
    const downloadOrders = async () => {
        try {
            setDownloading(true);

            // Create query parameters for download (no pagination, get all)
            const queryParams = {
                status: filters.status,
                limit: 10000 // Large number to get all records
            };

            // Add date filter if selected
            if (filters.selectedDate) {
                const selectedDate = new Date(filters.selectedDate);
                selectedDate.setHours(0, 0, 0, 0);
                queryParams.startDate = selectedDate.toISOString();

                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                queryParams.endDate = nextDay.toISOString();
            }

            // Fetch all orders for the current filter
            const response = await orderAPI.getAll(queryParams);
            const allOrders = response.data.orders || [];

            if (allOrders.length === 0) {
                alert('No orders to download');
                return;
            }

            // Prepare CSV data
            const csvData = convertToCSV(allOrders);

            // Create and download CSV file
            downloadCSV(csvData, getFileName());

        } catch (err) {
            console.error('Failed to download orders:', err);
            alert('Failed to download orders');
        } finally {
            setDownloading(false);
        }
    };

    // Convert orders array to CSV format
    const convertToCSV = (orders) => {
        const headers = [
            'Order ID',
            'Customer Name',
            'Customer Email',
            'Items Count',
            'Total Amount (₹)',
            'Status',
            'Payment Status',
            'Payment Method',
            'Order Date',
            'House Name',
            'Street',
            'City',
            'State',
            'Pincode',
            'Country',
            'Customer Phone'
        ];

        const rows = orders.map(order => [
            order.orderId || '',
            order.user?.firstName || 'Unknown',
            order.user?.email || '',
            order.items?.length || 0,
            order.total || 0,
            order.status || '',
            order.paymentStatus || '',
            order.paymentMethod || '',
            new Date(order.createdAt).toLocaleString(),
            order.address?.houseName || '',
            order.address?.street || '',
            order.address?.city || '',
            order.address?.state || '',
            order.address?.pincode || '',
            order.address?.country || '',
            order.address?.phoneNumber || '',
        ]);

        // Add headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    };

    // Download CSV file
    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Generate filename based on filters
    const getFileName = () => {
        let filename = 'orders';

        if (filters.status) {
            const statusLabel = statusTabs.find(t => t.key === filters.status)?.label || filters.status;
            filename += `_${statusLabel.toLowerCase().replace(/\s+/g, '_')}`;
        }

        if (filters.selectedDate) {
            const dateStr = new Date(filters.selectedDate).toISOString().split('T')[0];
            filename += `_${dateStr}`;
        }

        filename += `_${new Date().toISOString().split('T')[0]}.csv`;
        return filename;
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const handleDateChange = (date) => {
        setFilters(prev => ({
            ...prev,
            selectedDate: date,
            page: 1
        }));
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (newLimit) => {
        setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const generatePageNumbers = () => {
        const pages = [];
        const current = pagination.currentPage;
        const total = pagination.totalPages;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            if (current <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(total);
            } else if (current >= total - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = total - 4; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(total);
            }
        }

        return pages;
    };

    const handleStatusTabClick = (status) => {
        setFilters(prev => ({
            ...prev,
            status: status,
            page: 1 // Reset to first page when changing status
        }));
    };

    // Calculate serial number for each order
    const getSerialNumber = (index) => {
        return (filters.page - 1) * filters.limit + index + 1;
    };

    if (loading && orders.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>
                    Orders ({pagination.totalOrders})
                </h2>
                <button
                    className="btn btn-success"
                    onClick={downloadOrders}
                    disabled={downloading || orders.length === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={18} />
                    {downloading ? 'Downloading...' : 'Download Orders'}
                </button>
            </div>

            {/* Status Tabs */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '0.5rem' }}>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    padding: '0.25rem',
                    scrollbarWidth: 'thin'
                }}>
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`btn btn-tab ${filters.status === tab.key ? `btn-${tab.color} active` : 'btn-secondary'}`}
                            onClick={() => handleStatusTabClick(tab.key)}
                            style={{
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '8px',
                                border: filters.status === tab.key ? `2px solid var(--${tab.color}-color)` : '2px solid transparent',
                                fontWeight: filters.status === tab.key ? '600' : '400',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span>{tab.label}</span>
                            {statusStats[tab.key === '' ? 'all' : tab.key] > 0 && (
                                <span
                                    className="badge"
                                    style={{
                                        background: filters.status === tab.key ?
                                            `var(--${tab.color}-light)` :
                                            'var(--bg-tertiary)',
                                        color: filters.status === tab.key ?
                                            `var(--${tab.color}-dark)` :
                                            'var(--text-secondary)',
                                        fontSize: '0.75rem',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {statusStats[tab.key === '' ? 'all' : tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label className="form-label">Filter by Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="form-label">Items per page</label>
                        <select
                            className="form-select"
                            value={filters.limit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    {/* Status filter dropdown (optional, for mobile) */}
                    <div style={{ display: 'none' }}>
                        <label className="form-label">Filter by Status</label>
                        <select
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        >
                            <option value="">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {(filters.selectedDate || filters.status) && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <strong>Active Filters:</strong>
                                {filters.status && ` Status: ${statusTabs.find(t => t.key === filters.status)?.label}`}
                                {filters.selectedDate && ` | Date: ${new Date(filters.selectedDate).toLocaleDateString()}`}
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setFilters({ status: '', selectedDate: '', page: 1, limit: filters.limit })}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                                    {filters.status ?
                                        `No ${statusTabs.find(t => t.key === filters.status)?.label?.toLowerCase()} orders found.` :
                                        'No orders found.'
                                    }
                                </td>
                            </tr>
                        ) : (
                            orders.map((order, index) => (
                                <tr key={order._id}>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {getSerialNumber(index)}
                                    </td>
                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{order.orderId}</td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{order.user?.firstName || 'Unknown User'}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                {order.user?.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{order.items.length} items</td>
                                    <td style={{ fontWeight: '600' }}>₹{order.total}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            style={{
                                                fontSize: 'var(--font-size-xs)',
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: `var(--${getStatusBadgeColor(order.status)}-light)`,
                                                color: `var(--${getStatusBadgeColor(order.status)}-dark)`,
                                                border: `1px solid var(--${getStatusBadgeColor(order.status)}-color)`
                                            }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${getPaymentBadgeColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(order)}>
                                                <Eye size={16} style={{ marginRight: '0.25rem' }} /> View
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(order._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalOrders)} of {pagination.totalOrders} orders
                            {filters.status && (
                                <span style={{ marginLeft: '0.5rem', fontWeight: '600', color: `var(--${statusTabs.find(t => t.key === filters.status)?.color}-dark)` }}>
                                    ({statusTabs.find(t => t.key === filters.status)?.label})
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(1)}
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronsLeft size={16} />
                            </button>

                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {generatePageNumbers().map((page, index) => (
                                <button
                                    key={index}
                                    className={`btn btn-sm ${page === pagination.currentPage ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                                    disabled={page === '...'}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                            >
                                <ChevronRight size={16} />
                            </button>

                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={!pagination.hasNext}
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Order Details - {selectedOrder.orderId}</h3>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', marginBottom: '0.5rem' }}>
                                        Customer Information
                                    </h4>
                                    <p><strong>Name:</strong> {selectedOrder.user?.firstName || 'Unknown'}</p>
                                    <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.user?.phoneNumber || 'N/A'}</p>
                                    {selectedOrder.address && (
                                        <p>
                                            <strong>Shipping Address:</strong><br />
                                            {selectedOrder.address.houseName}<br />
                                            {selectedOrder.address.street}, {selectedOrder.address.city}<br />
                                            {selectedOrder.address.state}, {selectedOrder.address.pincode}<br />
                                            Phone: {selectedOrder.address.phoneNumber}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', marginBottom: '0.5rem' }}>
                                        Order Information
                                    </h4>
                                    <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                                    <p><strong>Status:</strong> <span className={`badge badge-${getStatusBadgeColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                                    <p><strong>Payment Status:</strong> <span className={`badge badge-${getPaymentBadgeColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span></p>
                                    <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                                    <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', marginBottom: '1rem' }}>
                                Order Items
                            </h4>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                    {index + 1}
                                                </td>
                                                <td>{item.name || item.product?.name || 'Product'}</td>
                                                <td>{item.quantity}</td>
                                                <td>₹{item.price}</td>
                                                <td style={{ fontWeight: '600' }}>₹{item.quantity * item.price}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                                            <td colSpan="4" style={{ textAlign: 'right', fontWeight: '700' }}>Total:</td>
                                            <td style={{ fontWeight: '800', fontSize: 'var(--font-size-lg)' }}>₹{selectedOrder.total}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper functions remain the same
function getStatusBadgeColor(status) {
    const colors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'secondary',
        delivered: 'success',
        cancelled: 'danger'
    };
    return colors[status] || 'info';
}

function getPaymentBadgeColor(status) {
    const colors = {
        pending: 'warning',
        paid: 'success',
        failed: 'danger',
        refunded: 'info'
    };
    return colors[status] || 'info';
}

export default Orders;