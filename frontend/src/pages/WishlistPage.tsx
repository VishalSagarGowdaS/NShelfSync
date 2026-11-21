import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';

export const WishlistPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadWishlist() {
      try {
        setIsLoading(true);
        const res = await api.getWishlist();
        if (res.items) {
          setItems(res.items);
        }
      } catch (err) {
        console.warn('Wishlist load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await api.removeFromWishlist(productId);
      setItems((prev) => prev.filter((it) => it.product_id !== productId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Saved Wishlist ({items.length} items)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Save your favorite products and purchase whenever ready
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 p-12 text-center rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the heart icon on any product card in ShelfSync to save items for later!
          </p>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-xs font-bold transition shadow"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.item_id} className="relative group">
              <ProductCard
                product={{
                  id: it.product_id,
                  name: it.name,
                  slug: it.slug,
                  description: '',
                  brand: it.brand,
                  base_price: Number(it.base_price),
                  discount_percent: Number(it.discount_percent),
                  final_price: Number(it.final_price),
                  rating: Number(it.rating),
                  review_count: 0,
                  image_url: it.image_url,
                  stock: 10,
                  in_stock: it.in_stock,
                }}
              />
              <button
                onClick={() => handleRemove(it.product_id)}
                className="absolute top-3 left-3 p-1.5 bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition shadow"
                title="Remove from wishlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
