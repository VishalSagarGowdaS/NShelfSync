import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User as UserIcon, Shield, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { name: 'All', path: '/search' },
    { name: 'Electronics', path: '/category/electronics' },
    { name: 'Fashion', path: '/category/fashion' },
    { name: 'Home & Kitchen', path: '/category/home-kitchen' },
    { name: 'Grocery', path: '/category/grocery' },
    { name: 'Beauty & Personal Care', path: '/category/beauty-personal-care' },
    { name: 'Sports & Fitness', path: '/category/sports-fitness' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white text-xs py-1.5 px-4 text-center font-medium">
        <span>⚡ Flash Sale: Get Flat 25% OFF on Electronics & Free Delivery on orders above ₹999 across India!</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              SS
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 font-sans">
                Shelf<span className="text-blue-600">Sync</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 -mt-1">
                India Store
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Search products, brands or try 'bluetoth hedphones under 1500'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-slate-50 transition"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold transition"
            >
              Search
            </button>
          </form>

          {/* Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition relative flex items-center"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Account / Auth Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-400 text-sm font-medium text-slate-800 transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{user?.fullName?.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4 mr-2.5 text-slate-400" />
                        My Profile & Addresses
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2.5 text-slate-400" />
                        My Orders
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-purple-700 font-semibold hover:bg-purple-50"
                        >
                          <Shield className="w-4 h-4 mr-2.5 text-purple-600" />
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-full transition shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-blue-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <form onSubmit={handleSearchSubmit} className="md:hidden pb-3 relative">
          <input
            type="text"
            placeholder="Search products in India..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2 rounded-full border border-slate-300 text-sm bg-slate-50"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Sub-navigation Pills */}
      <nav className="bg-slate-50 border-t border-slate-100 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center space-x-6 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.path}
              className="hover:text-blue-600 hover:underline underline-offset-4 transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};
