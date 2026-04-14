import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import ScrollToTop from './components/layout/ScrollToTop'

// Public pages
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import PromoLanding from './pages/PromoLanding'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import AboutPage from './pages/AboutPage'
import DeliveryPage from './pages/DeliveryPage'
import ContactsPage from './pages/ContactsPage'

// Protected pages
import AccountPage from './pages/AccountPage'
import AccountOrdersPage from './pages/AccountOrdersPage'
import WishlistPage from './pages/WishlistPage'
import AccountAddressesPage from './pages/AccountAddressesPage'
import PartnerPage from './pages/PartnerPage'
import CheckoutPage from './pages/CheckoutPage'
import CartPage from './pages/CartPage'
import AcademyPage from './pages/AcademyPage'
import StylistPage from './pages/StylistPage'

// Admin pages
import AdminPage from './pages/AdminPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminCustomersPage from './pages/AdminCustomersPage'
import AdminPartnersPage from './pages/AdminPartnersPage'
import AdminBlogPage from './pages/AdminBlogPage'
import AdminPromoPage from './pages/AdminPromoPage'
import AdminBannersPage from './pages/admin/AdminBannersPage'
import AdminLeadsPage from './pages/admin/AdminLeadsPage'
import AdminChatsPage from './pages/admin/AdminChatsPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminAcademyPage from './pages/admin/AdminAcademyPage'

// Other
import OnboardingPage from './pages/OnboardingPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get('ref')

    if (ref) {
      localStorage.setItem('ref_code', ref)
      localStorage.setItem('ref_expires', String(Date.now() + 30 * 24 * 60 * 60 * 1000))
    }
  }, [])

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/promo" element={<PromoLanding />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

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

          <Route path="login" element={<Navigate to="/" replace />} />
          <Route path="register" element={<Navigate to="/" replace />} />

          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="account/orders" element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>} />
          <Route path="account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="account/addresses" element={<ProtectedRoute><AccountAddressesPage /></ProtectedRoute>} />
          <Route path="account/partner" element={<ProtectedRoute><PartnerPage /></ProtectedRoute>} />
          <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="academy" element={<AcademyPage />} />
          <Route path="stylist" element={<ProtectedRoute><StylistPage /></ProtectedRoute>} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:id" element={<OrderSuccessPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin layout */}
        <Route
          path="/admin/*"
          element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="chats" element={<AdminChatsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="partners" element={<AdminPartnersPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="promo" element={<AdminPromoPage />} />
          <Route path="academy" element={<AdminAcademyPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
