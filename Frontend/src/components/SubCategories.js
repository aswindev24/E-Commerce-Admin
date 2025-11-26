import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { subCategoryAPI, categoryAPI } from '../services/api';

function SubCategories() {
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', category: '', status: 'active' });
    const [error, setError] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchSubCategories();
    }, []);

    useEffect(() => {
        fetchSubCategories();
    }, [filterCategory]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll();
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchSubCategories = async () => {
        try {
            const response = await subCategoryAPI.getAll(filterCategory);
            setSubCategories(response.data.subCategories);
        } catch (err) {
            setError('Failed to fetch subcategories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingSubCategory) {
                await subCategoryAPI.update(editingSubCategory._id, formData);
            } else {
                await subCategoryAPI.create(formData);
            }
            fetchSubCategories();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subcategory?')) {
            try {
                await subCategoryAPI.delete(id);
                fetchSubCategories();
            } catch (err) {
                setError('Failed to delete subcategory');
            }
        }
    };

    const openModal = (subCategory = null) => {
        if (subCategory) {
            setEditingSubCategory(subCategory);
            setFormData({
                name: subCategory.name,
                description: subCategory.description,
                category: subCategory.category._id,
                status: subCategory.status
            });
        } else {
            setEditingSubCategory(null);
            setFormData({ name: '', description: '', category: '', status: 'active' });
        }
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSubCategory(null);
        setFormData({ name: '', description: '', category: '', status: 'active' });
        setError('');
    };

    if (loading) {
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
                    SubCategories ({subCategories.length})
                </h2>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add SubCategory
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Filter by Category</label>
                <select
                    className="form-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ maxWidth: '300px' }}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subCategories.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No subcategories found. Create your first subcategory!
                                </td>
                            </tr>
                        ) : (
                            subCategories.map((subCategory) => (
                                <tr key={subCategory._id}>
                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{subCategory.name}</td>
                                    <td>
                                        <span className="badge badge-info">{subCategory.category.name}</span>
                                    </td>
                                    <td>{subCategory.description || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${subCategory.status === 'active' ? 'success' : 'danger'}`}>
                                            {subCategory.status}
                                        </span>
                                    </td>
                                    <td>{new Date(subCategory.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openModal(subCategory)}>
                                                <Edit size={16} style={{ marginRight: '0.25rem' }} /> Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(subCategory._id)}>
                                                <Trash2 size={16} style={{ marginRight: '0.25rem' }} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingSubCategory ? 'Edit SubCategory' : 'Add New SubCategory'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error">{error}</div>}

                                <div className="form-group">
                                    <label className="form-label">Parent Category *</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">SubCategory Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingSubCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubCategories;
