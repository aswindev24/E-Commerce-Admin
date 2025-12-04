import React, { useState, useEffect } from 'react';
import { couponAPI } from '../services/api';
import { Plus, Edit2, Trash2, Search, Tag, TrendingUp, Calendar, Users } from 'lucide-react';
import './Coupons.css';

function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        couponCode: '',
        description: '',
        discountPercentage: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        expiryDate: '',
        usageLimitPerUser: '1',
        totalUsageLimit: '',
        isActive: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await couponAPI.getAll();
            setCoupons(response.data.coupons);
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                discountPercentage: Number(formData.discountPercentage),
                minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
                usageLimitPerUser: Number(formData.usageLimitPerUser),
                totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null
            };

            if (editingCoupon) {
                await couponAPI.update(editingCoupon._id, submitData);
            } else {
                await couponAPI.create(submitData);
            }

            fetchCoupons();
            closeModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save coupon');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await couponAPI.delete(id);
                fetchCoupons();
            } catch (error) {
                alert('Failed to delete coupon');
            }
        }
    };

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                couponCode: coupon.couponCode,
                description: coupon.description,
                discountPercentage: coupon.discountPercentage,
                minOrderAmount: coupon.minOrderAmount || '',
                maxDiscountAmount: coupon.maxDiscountAmount || '',
                expiryDate: coupon.expiryDate.split('T')[0],
                usageLimitPerUser: coupon.usageLimitPerUser,
                totalUsageLimit: coupon.totalUsageLimit || '',
                isActive: coupon.isActive
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                couponCode: '',
                description: '',
                discountPercentage: '',
                minOrderAmount: '',
                maxDiscountAmount: '',
                expiryDate: '',
                usageLimitPerUser: '1',
                totalUsageLimit: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCoupon(null);
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isExpired = (date) => new Date(date) < new Date();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="coupons-container">
            <div className="coupons-header">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search coupons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="add-btn" onClick={() => openModal()}>
                    <Plus size={20} />
                    Add Coupon
                </button>
            </div>

            <div className="coupons-grid">
                {filteredCoupons.map(coupon => (
                    <div key={coupon._id} className={`coupon-card ${!coupon.isActive ? 'inactive' : ''} ${isExpired(coupon.expiryDate) ? 'expired' : ''}`}>
                        <div className="coupon-header-card">
                            <div className="coupon-code-badge">
                                <Tag size={18} />
                                <span>{coupon.couponCode}</span>
                            </div>
                            <div className="coupon-actions">
                                <button onClick={() => openModal(coupon)} className="icon-btn edit">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(coupon._id)} className="icon-btn delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="coupon-description">{coupon.description}</p>

                        <div className="coupon-stats">
                            <div className="stat-item">
                                <TrendingUp size={16} />
                                <span>{coupon.discountPercentage}% OFF</span>
                            </div>
                            <div className="stat-item">
                                <Users size={16} />
                                <span>{coupon.totalUsedCount || 0} uses</span>
                            </div>
                            <div className="stat-item">
                                <Calendar size={16} />
                                <span>{new Date(coupon.expiryDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="coupon-details">
                            {coupon.minOrderAmount > 0 && (
                                <div className="detail-row">
                                    <span>Min Order:</span>
                                    <strong>₹{coupon.minOrderAmount}</strong>
                                </div>
                            )}
                            {coupon.maxDiscountAmount && (
                                <div className="detail-row">
                                    <span>Max Discount:</span>
                                    <strong>₹{coupon.maxDiscountAmount}</strong>
                                </div>
                            )}
                            <div className="detail-row">
                                <span>Per User Limit:</span>
                                <strong>{coupon.usageLimitPerUser} time(s)</strong>
                            </div>
                            {coupon.totalUsageLimit && (
                                <div className="detail-row">
                                    <span>Total Limit:</span>
                                    <strong>{coupon.totalUsageLimit} uses</strong>
                                </div>
                            )}
                        </div>

                        <div className="coupon-status">
                            {isExpired(coupon.expiryDate) ? (
                                <span className="status-badge expired">Expired</span>
                            ) : coupon.isActive ? (
                                <span className="status-badge active">Active</span>
                            ) : (
                                <span className="status-badge inactive">Inactive</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredCoupons.length === 0 && (
                <div className="empty-state">
                    <Tag size={48} />
                    <h3>No coupons found</h3>
                    <p>Create your first coupon to get started</p>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={formData.couponCode}
                                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="e.g., DIWALI25"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Discount Percentage *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.discountPercentage}
                                        onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                        required
                                        placeholder="e.g., 25"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Description *</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        placeholder="e.g., Diwali Sale 2025"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Expiry Date *</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Usage Limit Per User *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usageLimitPerUser}
                                        onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                                        required
                                        placeholder="e.g., 1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Min Order Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Max Discount Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.maxDiscountAmount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Total Usage Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.totalUsageLimit}
                                        onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                                        placeholder="Optional (unlimited)"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span>Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    {editingCoupon ? 'Update' : 'Create'} Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Coupons;
