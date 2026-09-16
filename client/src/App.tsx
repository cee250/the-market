import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ComparePage } from './pages/ComparePage';
import { HelpPage } from './pages/HelpPage';
import { HomePage } from './pages/HomePage';
import { ListingPage } from './pages/ListingPage';
import { LoginPage, PasswordResetPage, RegisterPage } from './pages/AuthPages';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductPage } from './pages/ProductPage';
import { WishlistPage } from './pages/WishlistPage';
import { VendorRegistrationPage } from './pages/VendorRegistrationPage';
import { VendorPaymentPage } from './pages/VendorPaymentPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminVendorsPage } from './pages/AdminVendorsPage';
import { AdminPackagesPage } from './pages/AdminPackagesPage';
import { VendorEntitlementPage } from './pages/VendorEntitlementPage';
import { VendorSubscriptionPage } from './pages/VendorSubscriptionPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { VendorShopPage } from './pages/VendorShopPage';
import { PublicShopPage } from './pages/PublicShopPage';
import { VendorProductsPage } from './pages/VendorProductsPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { VendorInventoryPage } from './pages/VendorInventoryPage';
import { VendorFulfillmentPage } from './pages/VendorFulfillmentPage';
import { AdminOperationsPage } from './pages/AdminOperationsPage';
import { VendorAnalyticsPage } from './pages/VendorAnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ListingPage mode="shop" />} />
          <Route path="/category/:slug" element={<ListingPage mode="category" />} />
          <Route path="/search" element={<ListingPage mode="search" />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/vendor" element={<VendorRegistrationPage />} />
          <Route path="/vendor/payment" element={<VendorPaymentPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/vendors" element={<AdminVendorsPage />} />
          <Route path="/admin/packages" element={<AdminPackagesPage />} />
          <Route path="/vendor/entitlement" element={<VendorEntitlementPage />} />
          <Route path="/vendor/subscription" element={<VendorSubscriptionPage />} />
          <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="/vendor/shop" element={<VendorShopPage />} />
          <Route path="/shop/:slug" element={<PublicShopPage />} />
          <Route path="/vendor/products" element={<VendorProductsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/vendor/inventory" element={<VendorInventoryPage />} />
          <Route path="/vendor/fulfillment" element={<VendorFulfillmentPage />} />
          <Route path="/vendor/analytics" element={<VendorAnalyticsPage />} />
          <Route path="/admin/operations" element={<AdminOperationsPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
