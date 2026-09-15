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
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
