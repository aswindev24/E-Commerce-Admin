import React, { useState, useEffect } from 'react';
import { Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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

    useEffect(() => {
        fetchOrders();
    }, [filters]);

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

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderAPI.update(orderId, { status: newStatus });
            fetchOrders();
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
            } catch (err) {
                setError('Failed to delete order');
            }
        }
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
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
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
                </div>

                {/* Active Filters Summary */}
                {(filters.selectedDate || filters.status) && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <strong>Active Filters:</strong>
                                {filters.status && ` Status: ${filters.status}`}
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
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order._id}>
                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{order.orderNumber}</td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{order.customer.name}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                {order.customer.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{order.items.length} items</td>
                                    <td style={{ fontWeight: '600' }}>₹{order.totalAmount}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            style={{ fontSize: 'var(--font-size-xs)', padding: '0.25rem 0.5rem' }}
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
                            <h3 className="modal-title">Order Details - {selectedOrder.orderNumber}</h3>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', marginBottom: '0.5rem' }}>
                                        Customer Information
                                    </h4>
                                    <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                                    {selectedOrder.customer.address && (
                                        <p>
                                            <strong>Address:</strong><br />
                                            {selectedOrder.customer.address.street}<br />
                                            {selectedOrder.customer.address.city}, {selectedOrder.customer.address.state}<br />
                                            {selectedOrder.customer.address.zipCode}, {selectedOrder.customer.address.country}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', marginBottom: '0.5rem' }}>
                                        Order Information
                                    </h4>
                                    <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
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
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name || item.product?.name || 'Product'}</td>
                                                <td>{item.quantity}</td>
                                                <td>₹{item.price}</td>
                                                <td style={{ fontWeight: '600' }}>₹{item.quantity * item.price}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                                            <td colSpan="3" style={{ textAlign: 'right', fontWeight: '700' }}>Total:</td>
                                            <td style={{ fontWeight: '800', fontSize: 'var(--font-size-lg)' }}>₹{selectedOrder.totalAmount}</td>
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

function getStatusBadgeColor(status) {
    const colors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'info',
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