import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Folder,
    FolderOpen,
    Package,
    ShoppingCart,
    LogOut,
    Menu,
    X,
    Clock,
    CheckCircle,
    Key,
    Tag,
    Image as ImageIcon
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Categories from './Categories';
import SubCategories from './SubCategories';
import Products from './Products';
import Orders from './Orders';
import ChangePassword from './ChangePassword';
import Coupons from './Coupons';
import OfferImages from './OfferImages';
import './Dashboard.css';
import admin from '../assets/admin.jpg'

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [adminUser, setAdminUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('adminUser');
        if (user) {
            setAdminUser(JSON.parse(user));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="brand-title">LESTORA</h2>

                        </div>
                        <button
                            className="lg:hidden text-white"
                            onClick={toggleSidebar}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: window.innerWidth <= 768 ? 'block' : 'none' }}
                        >
                            <X size={24} color="white" />
                        </button>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" active={isActive('/dashboard')} icon={<LayoutDashboard size={20} />}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/dashboard/categories" active={isActive('/dashboard/categories')} icon={<Folder size={20} />}>
                        Categories
                    </NavLink>
                    <NavLink to="/dashboard/subcategories" active={isActive('/dashboard/subcategories')} icon={<FolderOpen size={20} />}>
                        SubCategories
                    </NavLink>
                    <NavLink to="/dashboard/products" active={isActive('/dashboard/products')} icon={<Package size={20} />}>
                        Products
                    </NavLink>
                    <NavLink to="/dashboard/orders" active={isActive('/dashboard/orders')} icon={<ShoppingCart size={20} />}>
                        Orders
                    </NavLink>
                    <NavLink to="/dashboard/coupons" active={isActive('/dashboard/coupons')} icon={<Tag size={20} />}>
                        Coupons
                    </NavLink>
                    <NavLink to="/dashboard/offer-images" active={isActive('/dashboard/offer-images')} icon={<ImageIcon size={20} />}>
                        Offer Images
                    </NavLink>
                    <NavLink to="/dashboard/change-password" active={isActive('/dashboard/change-password')} icon={<Key size={20} />}>
                        Change Password
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} style={{ marginRight: '8px' }} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={toggleSidebar}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: window.innerWidth <= 768 ? 'block' : 'none'
                            }}
                        >
                            <Menu size={24} color="#002b36" />
                        </button>
                        <h1 className="header-title">
                            {getPageTitle(location.pathname)}
                        </h1>
                    </div>
                </header>

                <div className="content-wrapper">
                    <Routes>
                        <Route index element={<DashboardHome />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="subcategories" element={<SubCategories />} />
                        <Route path="products" element={<Products />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="coupons" element={<Coupons />} />
                        <Route path="offer-images" element={<OfferImages />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function NavLink({ to, active, icon, children }) {
    return (
        <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            {children}
        </Link>
    );
}

function DashboardHome() {
    const [stats, setStats] = useState({
        totalCategories: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const { categoryAPI, productAPI, orderAPI } = await import('../services/api');
            const [categoriesRes, productsRes, ordersRes] = await Promise.all([
                categoryAPI.getAll(),
                productAPI.getAll(),
                orderAPI.getAll()
            ]);

            const totalCategories = categoriesRes.data.categories?.length || 0;
            const totalProducts = productsRes.data.products?.length || 0;
            const totalOrders = ordersRes.data.orders?.length || 0;
            const pendingOrders = ordersRes.data.orders?.filter(order => order.status === 'pending').length || 0;

            setStats({
                totalCategories,
                totalProducts,
                totalOrders,
                pendingOrders
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Prepare data for charts
    const orderData = [
        { name: 'Total Orders', value: stats.totalOrders },
        { name: 'Pending Orders', value: stats.pendingOrders },
        { name: 'Completed Orders', value: stats.totalOrders - stats.pendingOrders }
    ];

    const categoryProductData = [
        { name: 'Categories', value: stats.totalCategories },
        { name: 'Products', value: stats.totalProducts }
    ];

    const COLORS = ['#10b981', '#f59e0b', '#667eea'];
    const PIE_COLORS = ['#249e34ff', '#667eea'];

    return (
        <div>
            <div className="welcome-admin"  >
                <div className="welcome-message">
                    <h3>Welcome back</h3>
                    <p>Let's start our day with great energy!</p>
                </div>
                <div className="admin-photo">
                    <img src={admin} alt="Admin" />
                </div>
            </div>
            <div className="stats-grid">
                <StatCard title="Total Categories" value={stats.totalCategories} icon={<Folder size={24} />} color="#667eea" />
                <StatCard title="Total Products" value={stats.totalProducts} icon={<Package size={24} />} color="#f093fb" />
                <StatCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingCart size={24} />} color="#10b981" />
                <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<Clock size={24} />} color="#f59e0b" />
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Line Chart - Orders */}
                <div className="chart-card">
                    <h3 className="chart-title">Orders Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={orderData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart - Categories & Products */}
                {/* Pie Chart - Categories & Products */}
                <div className="chart-card">
                    <h3 className="chart-title">Categories vs Products</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryProductData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                dataKey="value"
                            // REMOVED: fill="#8884d8" 
                            >
                                {categoryProductData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

            </div>

        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="stat-info">
                <h3>{title}</h3>
                <p>{value}</p>
            </div>
        </div>
    );
}

function getPageTitle(pathname) {
    const titles = {
        '/dashboard': 'Dashboard Overview',
        '/dashboard/categories': 'Category Management',
        '/dashboard/subcategories': 'SubCategory Management',
        '/dashboard/products': 'Product Inventory',
        '/dashboard/orders': 'Order Management',
        '/dashboard/coupons': 'Coupon Management',
        '/dashboard/offer-images': 'Offer Images Management',
        '/dashboard/change-password': 'Change Password'
    };
    return titles[pathname] || 'Dashboard';
}

export default Dashboard;
