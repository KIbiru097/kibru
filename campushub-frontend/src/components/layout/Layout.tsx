import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useCart } from '../../context/CartContext';
import StickyCartBar from '../cart/StickyCartBar';

export default function Layout() {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="pt-16 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
      {itemCount > 0 && <StickyCartBar />}
    </div>
  );
}
