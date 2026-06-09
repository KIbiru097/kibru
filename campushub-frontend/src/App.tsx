import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/graphql';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FoodPage from './pages/FoodPage';
import MarketplacePage from './pages/MarketplacePage';
import MessagingPage from './pages/MessagingPage';
import CartPage from './pages/CartPage';
import DeliveryPage from './pages/DeliveryPage';
import ServicesPage from './pages/ServicesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/food" element={<FoodPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/messages" element={<MessagingPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/deliveries" element={<DeliveryPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
