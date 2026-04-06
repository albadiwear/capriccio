import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'

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
import AdminBannersPage from './pages/admin/AdminBannersPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'

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
        {/* Public layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:category" element={<CatalogPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="delivery" element={<DeliveryPage />} />
          <Route path="contacts" element={<ContactsPage />} />

          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="account/orders" element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>} />
          <Route path="account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="account/partner" element={<ProtectedRoute><PartnerPage /></ProtectedRoute>} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:id" element={<OrderSuccessPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin layout */}
        <Route
          path="/admin"
          element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="partners" element={<AdminPartnersPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="promo" element={<AdminPromoPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
