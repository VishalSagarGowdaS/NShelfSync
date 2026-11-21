import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryProducts() {
      if (!slug) return;
      try {
        setIsLoading(true);
        const res = await api.getProducts({ category: slug, limit: 20 });
        if (res.products) {
          setProducts(res.products);
          setCategoryName(res.products[0]?.category || slug.replace('-', ' ').toUpperCase());
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadCategoryProducts();
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Category Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <Link to="/" className="inline-flex items-center text-xs text-blue-300 hover:text-white transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Storefront
          </Link>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Department</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black capitalize tracking-tight">
            {slug?.replace(/-/g, ' ')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Authentic, verified products with real-time stock levels synced across Mumbai, Delhi NCR, and Bengaluru hubs.
          </p>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-80"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 p-8">
          <p className="text-sm font-bold text-slate-700">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};
