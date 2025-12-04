import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { offerImageAPI } from '../services/api';
import './OfferImages.css';

function OfferImages() {
    const [offerImages, setOfferImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [formData, setFormData] = useState({
        image: null,
        description: '',
        displayOrder: 0,
        startDate: '',
        endDate: '',
        status: 'active'
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchOfferImages();
    }, []);

    const fetchOfferImages = async () => {
        try {
            const response = await offerImageAPI.getAll();
            setOfferImages(response.data.offerImages);
        } catch (error) {
            console.error('Failed to fetch offer images:', error);
        } finally {
            setLoading(false);
        }
    };

    // Separate active and inactive offers
    const activeOffers = offerImages.filter(img => img.status === 'active');
    const inactiveOffers = offerImages.filter(img => img.status === 'inactive');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file
            }));

            // Create preview URL from the file
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            const data = new FormData();

            // Always append the image file if present
            if (formData.image) {
                data.append('image', formData.image);
            }

            data.append('description', formData.description);
            data.append('displayOrder', formData.displayOrder);

            // Append dates only if they have values
            if (formData.startDate) {
                data.append('startDate', formData.startDate);
            }
            if (formData.endDate) {
                data.append('endDate', formData.endDate);
            }

            data.append('status', formData.status);

            if (editingImage) {
                await offerImageAPI.update(editingImage._id, data);
            } else {
                await offerImageAPI.create(data);
            }

            fetchOfferImages();
            closeModal();
        } catch (error) {
            console.error('Failed to save offer image:', error);
            alert(`Failed to save offer image: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this offer image?')) {
            try {
                await offerImageAPI.delete(id);
                fetchOfferImages();
            } catch (error) {
                console.error('Failed to delete offer image:', error);
                alert('Failed to delete offer image');
            }
        }
    };

    const openModal = (offerImage = null) => {
        if (offerImage) {
            setEditingImage(offerImage);
            setFormData({
                image: null,
                description: offerImage.description || '',
                displayOrder: offerImage.displayOrder || 0,
                startDate: offerImage.startDate ? new Date(offerImage.startDate).toISOString().split('T')[0] : '',
                endDate: offerImage.endDate ? new Date(offerImage.endDate).toISOString().split('T')[0] : '',
                status: offerImage.status || 'active'
            });

            // Use the stored URL directly
            setPreviewUrl(offerImage.image);
        } else {
            setEditingImage(null);
            setFormData({
                image: null,
                description: '',
                displayOrder: 0,
                startDate: '',
                endDate: '',
                status: 'active'
            });
            setPreviewUrl(null);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingImage(null);
        setFormData({
            image: null,
            description: '',
            displayOrder: 0,
            startDate: '',
            endDate: '',
            status: 'active'
        });
        setPreviewUrl(null);
    };

    // Helper function to get image display URL
    const getImageUrl = (imageUrl) => {
        // If it's already a full URL, use it directly
        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            return imageUrl;
        }
        // If it's a relative path, use it as is (the browser will handle it)
        return imageUrl;
    };

    const renderOfferCard = (item) => (
        <div key={item._id} className="offer-image-card">
            <div className="image-wrapper">
                <img
                    src={getImageUrl(item.image)}
                    alt={item.description}
                    className="offer-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                />
                <div className="image-overlay">
                    <button
                        onClick={() => openModal(item)}
                        className="overlay-btn edit-btn"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(item._id)}
                        className="overlay-btn delete-btn"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            <div className="card-content">
                <div className="card-headerOffer">
                    <span className={`status-badge ${item.status}`}>
                        {item.status}
                    </span>
                    <span className="display-order">Order: {item.displayOrder}</span>
                </div>
                <p className="card-description">
                    {item.description || 'No description'}
                </p>
                <div className="card-dates">
                    {item.startDate && (
                        <div className="date-item">
                            <span className="date-label">Start:</span>
                            <span className="date-value">
                                {new Date(item.startDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                    {item.endDate && (
                        <div className="date-item">
                            <span className="date-label">End:</span>
                            <span className="date-value">
                                {new Date(item.endDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="card-url">
                    <small className="url-text" title={item.image}>
                        Image URL: {item.image ? 'Available' : 'Not set'}
                    </small>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading offer images...</p>
            </div>
        );
    }

    return (
        <div className="offer-images-container">
            <div className="offer-images-header">
                <h2 className="offer-images-title">Offer Images</h2>
                <button onClick={() => openModal()} className="add-image-btn">
                    <Plus size={20} />
                    Add New Image
                </button>
            </div>

            {/* Active Offers Section */}
            <div className="offers-section">
                <div className="section-header">
                    <h3 className="section-title">Active Offers</h3>
                    <span className="section-count">{activeOffers.length} {activeOffers.length === 1 ? 'Offer' : 'Offers'}</span>
                </div>
                {activeOffers.length > 0 ? (
                    <div className="offer-images-grid">
                        {activeOffers.map(item => renderOfferCard(item))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <ImageIcon size={48} className="empty-icon" />
                        <p className="empty-text">No active offers available</p>
                        <button onClick={() => openModal()} className="empty-action-btn">
                            <Plus size={16} />
                            Create First Offer
                        </button>
                    </div>
                )}
            </div>

            {/* Inactive Offers Section */}
            <div className="offers-section">
                <div className="section-header">
                    <h3 className="section-title">Inactive Offers</h3>
                    <span className="section-count inactive-count">{inactiveOffers.length} {inactiveOffers.length === 1 ? 'Offer' : 'Offers'}</span>
                </div>
                {inactiveOffers.length > 0 ? (
                    <div className="offer-images-grid">
                        {inactiveOffers.map(item => renderOfferCard(item))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <ImageIcon size={48} className="empty-icon" />
                        <p className="empty-text">No inactive offers</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingImage ? 'Edit Offer Image' : 'Add Offer Image'}
                            </h3>
                            <button onClick={closeModal} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">
                                    Image
                                    <span className="required-indicator"> *</span>
                                </label>
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="file-input"
                                        id="image-upload"
                                        required={!editingImage} // Required for new images
                                    />
                                    <label htmlFor="image-upload" className="upload-label">
                                        {previewUrl ? (
                                            <div className="preview-container">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="preview-image"
                                                />
                                                <div className="preview-overlay">
                                                    <Upload size={24} className="upload-icon" />
                                                    <span className="upload-text">Click to change image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="upload-placeholder">
                                                <Upload size={32} className="upload-icon" />
                                                <span className="upload-text">Click to upload image</span>
                                                <span className="upload-hint">Supports: JPG, PNG, WEBP (Max 5MB)</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                                {editingImage && formData.image === null && (
                                    <div className="current-image-info">
                                        <p className="info-text">Current image is preserved</p>
                                        <small className="info-url" title={editingImage.image}>
                                            URL: {editingImage.image}
                                        </small>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Enter offer description..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Display Order</label>
                                    <input
                                        type="number"
                                        name="displayOrder"
                                        value={formData.displayOrder}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="0"
                                        placeholder="0"
                                    />
                                    <small className="form-hint">Lower numbers appear first</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                    <small className="form-hint">Optional - when offer starts</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                    <small className="form-hint">Optional - when offer ends</small>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="cancel-btn"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="spinner"></span>
                                            {editingImage ? 'Updating...' : 'Uploading...'}
                                        </>
                                    ) : (
                                        editingImage ? 'Update Image' : 'Add Image'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OfferImages;