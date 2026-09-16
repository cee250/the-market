import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then((m) => ({ default: m.ComparePage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then((m) => ({ default: m.HelpPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ListingPage = lazy(() => import('./pages/ListingPage').then((m) => ({ default: m.ListingPage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const PasswordResetPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.PasswordResetPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const VendorRegistrationPage = lazy(() => import('./pages/VendorRegistrationPage').then((m) => ({ default: m.VendorRegistrationPage })));
const VendorPaymentPage = lazy(() => import('./pages/VendorPaymentPage').then((m) => ({ default: m.VendorPaymentPage })));
const AdminPaymentsPage = lazy(() => import('./pages/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminVendorsPage = lazy(() => import('./pages/AdminVendorsPage').then((m) => ({ default: m.AdminVendorsPage })));
const AdminPackagesPage = lazy(() => import('./pages/AdminPackagesPage').then((m) => ({ default: m.AdminPackagesPage })));
const VendorEntitlementPage = lazy(() => import('./pages/VendorEntitlementPage').then((m) => ({ default: m.VendorEntitlementPage })));
const VendorSubscriptionPage = lazy(() => import('./pages/VendorSubscriptionPage').then((m) => ({ default: m.VendorSubscriptionPage })));
const VendorDashboardPage = lazy(() => import('./pages/VendorDashboardPage').then((m) => ({ default: m.VendorDashboardPage })));
const VendorShopPage = lazy(() => import('./pages/VendorShopPage').then((m) => ({ default: m.VendorShopPage })));
const PublicShopPage = lazy(() => import('./pages/PublicShopPage').then((m) => ({ default: m.PublicShopPage })));
const VendorProductsPage = lazy(() => import('./pages/VendorProductsPage').then((m) => ({ default: m.VendorProductsPage })));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const VendorInventoryPage = lazy(() => import('./pages/VendorInventoryPage').then((m) => ({ default: m.VendorInventoryPage })));
const VendorFulfillmentPage = lazy(() => import('./pages/VendorFulfillmentPage').then((m) => ({ default: m.VendorFulfillmentPage })));
const AdminOperationsPage = lazy(() => import('./pages/AdminOperationsPage').then((m) => ({ default: m.AdminOperationsPage })));
const VendorAnalyticsPage = lazy(() => import('./pages/VendorAnalyticsPage').then((m) => ({ default: m.VendorAnalyticsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));

function PageFallback() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading…</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
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
            <Route path="/notifications" element={<NotificationsPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}
