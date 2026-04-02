import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Public pages
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import AboutPage from './pages/AboutPage'
import DeliveryPage from './pages/DeliveryPage'
import ContactsPage from './pages/ContactsPage'

// Auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Protected pages
import AccountPage from './pages/AccountPage'
import AccountOrdersPage from './pages/AccountOrdersPage'
import WishlistPage from './pages/WishlistPage'
import PartnerPage from './pages/PartnerPage'
import CheckoutPage from './pages/CheckoutPage'

// Admin pages
import AdminPage from './pages/AdminPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminCustomersPage from './pages/AdminCustomersPage'
import AdminPartnersPage from './pages/AdminPartnersPage'
import AdminBlogPage from './pages/AdminBlogPage'
import AdminPromoPage from './pages/AdminPromoPage'

// Other
import OrderSuccessPage from './pages/OrderSuccessPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:category" element={<CatalogPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="delivery" element={<DeliveryPage />} />
          <Route path="contacts" element={<ContactsPage />} />

          {/* Auth routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="account/orders" element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>} />
          <Route path="account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="account/partner" element={<ProtectedRoute><PartnerPage /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="order-success/:id" element={<OrderSuccessPage />} />

          {/* Admin routes */}
          <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="admin/orders" element={<ProtectedRoute adminOnly><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="admin/products" element={<ProtectedRoute adminOnly><AdminProductsPage /></ProtectedRoute>} />
          <Route path="admin/customers" element={<ProtectedRoute adminOnly><AdminCustomersPage /></ProtectedRoute>} />
          <Route path="admin/partners" element={<ProtectedRoute adminOnly><AdminPartnersPage /></ProtectedRoute>} />
          <Route path="admin/blog" element={<ProtectedRoute adminOnly><AdminBlogPage /></ProtectedRoute>} />
          <Route path="admin/promo" element={<ProtectedRoute adminOnly><AdminPromoPage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
