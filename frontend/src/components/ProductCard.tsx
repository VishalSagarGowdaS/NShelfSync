import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsAdding(true);
      await addToCart(product.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in to save items to your wishlist.');
      return;
    }

    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch {
      // Quiet fail
    }
  };

  const discountAmount = product.discount_percent > 0
    ? Math.round((product.base_price * product.discount_percent) / 100)
    : 0;
  const finalPrice = product.final_price || (product.base_price - discountAmount);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition duration-300 flex flex-col justify-between">
      
      {/* Top Image & Wishlist Button */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {product.discount_percent > 0 && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider">
            {product.discount_percent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition shadow-sm ${
            isWishlisted
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 text-slate-500 hover:text-red-500 hover:bg-white'
          }`}
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Out Overlay if 0 */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
            <span className="text-blue-600 font-bold">{product.brand}</span>
            {product.category && <span>{product.category}</span>}
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`}>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug mb-2 transition">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center space-x-1.5 mb-3">
            <div className="flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">
              <Star className="w-3 h-3 fill-current mr-1 text-emerald-600" />
              <span>{product.rating ? Number(product.rating).toFixed(1) : '4.5'}</span>
            </div>
            <span className="text-xs text-slate-400">
              ({product.review_count ? product.review_count.toLocaleString('en-IN') : '1.2k'})
            </span>
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-black text-slate-900">
                ₹{Number(finalPrice).toLocaleString('en-IN')}
              </span>
              {product.discount_percent > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{Number(product.base_price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {product.in_stock ? (
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                ● In Stock ({product.stock} units)
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-red-500">
                ● Currently Unavailable
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock || isAdding}
            className={`p-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center shadow-sm ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : !product.in_stock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
            }`}
            title="Add to Cart"
          >
            {justAdded ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
