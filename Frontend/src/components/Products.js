import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { productAPI, categoryAPI, subCategoryAPI } from '../services/api';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        subCategory: '',
        stock: '',
        status: 'active'
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        categoryId: '',
        subCategoryId: '',
        search: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        hasNext: false,
        hasPrev: false
    });

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    useEffect(() => {
        if (formData.category) {
            fetchSubCategoriesByCategory(formData.category);
        }
    }, [formData.category]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll();
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchSubCategoriesByCategory = async (categoryId) => {
        try {
            const response = await subCategoryAPI.getAll(categoryId);
            setSubCategories(response.data.subCategories);
        } catch (err) {
            console.error('Failed to fetch subcategories');
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getAll(filters);
            setProducts(response.data.products);

            // Update pagination info from API response
            if (response.data.pagination) {
                setPagination({
                    currentPage: response.data.pagination.currentPage,
                    totalPages: response.data.pagination.totalPages,
                    totalProducts: response.data.pagination.totalProducts,
                    hasNext: response.data.pagination.hasNext,
                    hasPrev: response.data.pagination.hasPrev
                });
            }
        } catch (err) {
            setError('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', parseFloat(formData.price));
        formDataToSend.append('category', formData.category);
        formDataToSend.append('subCategory', formData.subCategory);
        formDataToSend.append('stock', parseInt(formData.stock));
        formDataToSend.append('status', formData.status);

        if (editingProduct && existingImages.length > 0) {
            formDataToSend.append('existingImages', JSON.stringify(existingImages));
        }

        selectedFiles.forEach((file) => {
            formDataToSend.append('images', file);
        });

        try {
            if (editingProduct) {
                await productAPI.update(editingProduct._id, formDataToSend);
            } else {
                await productAPI.create(formDataToSend);
            }
            fetchProducts();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productAPI.delete(id);
                fetchProducts();
            } catch (err) {
                setError('Failed to delete product');
            }
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError(`${file.name} is not a valid image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError(`${file.name} is too large. Max size is 5MB`);
                return false;
            }
            return true;
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setError('');
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category._id,
                subCategory: product.subCategory._id,
                stock: product.stock,
                status: product.status
            });
            setExistingImages(product.images || []);
            setSelectedFiles([]);
            fetchSubCategoriesByCategory(product.category._id);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                subCategory: '',
                stock: '',
                status: 'active'
            });
            setExistingImages([]);
            setSelectedFiles([]);
            setSubCategories([]);
        }
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            subCategory: '',
            stock: '',
            status: 'active'
        });
        setExistingImages([]);
        setSelectedFiles([]);
        setError('');
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

    if (loading && products.length === 0) {
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
                    Products ({pagination.totalProducts})
                </h2>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Product
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search products..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={filters.categoryId}
                            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, subCategoryId: '', page: 1 })}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
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
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>SubCategory</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No products found. Create your first product!
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product._id}>
                                    <td>
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={`http://localhost:5000${product.images[0]}`}
                                                alt={product.name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                No Image
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{product.name}</td>
                                    <td><span className="badge badge-info">{product.category.name}</span></td>
                                    <td><span className="badge badge-info">{product.subCategory.name}</span></td>
                                    <td style={{ fontWeight: '600' }}>₹{product.price}</td>
                                    <td>
                                        <span className={`badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${product.status === 'active' ? 'success' : 'danger'}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openModal(product)}>
                                                <Edit size={16} style={{ marginRight: '0.25rem' }} /> Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, pagination.totalProducts)} of {pagination.totalProducts} products
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* First Page */}
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(1)}
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronsLeft size={16} />
                            </button>

                            {/* Previous Page */}
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {/* Page Numbers */}
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

                            {/* Next Page */}
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                            >
                                <ChevronRight size={16} />
                            </button>

                            {/* Last Page */}
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

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error">{error}</div>}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Product Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Price *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select
                                            className="form-select"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">SubCategory *</label>
                                        <select
                                            className="form-select"
                                            value={formData.subCategory}
                                            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                            required
                                            disabled={!formData.category}
                                        >
                                            <option value="">Select SubCategory</option>
                                            {subCategories.map((subCat) => (
                                                <option key={subCat._id} value={subCat._id}>{subCat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Stock *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            required
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
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Product Images</label>
                                    <input
                                        type="file"
                                        className="form-input"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                    />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        Accepted formats: JPG, PNG, GIF, WEBP (Max 5MB per image)
                                    </small>
                                </div>

                                {/* Existing Images Preview */}
                                {existingImages.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Existing Images</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                            {existingImages.map((img, index) => (
                                                <div key={index} style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <img
                                                        src={`http://localhost:5000${img}`}
                                                        alt={`Existing ${index + 1}`}
                                                        style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            background: 'rgba(239, 68, 68, 0.9)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 0
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Images Preview */}
                                {selectedFiles.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">New Images ({selectedFiles.length})</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Preview ${index + 1}`}
                                                        style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSelectedFile(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            background: 'rgba(239, 68, 68, 0.9)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 0
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;