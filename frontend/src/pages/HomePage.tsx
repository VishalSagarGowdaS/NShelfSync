import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, Zap, Award, Tag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';
import { Product, Category } from '../types';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          api.getCategories().catch(() => ({ success: true, categories: [] })),
          api.getProducts({ limit: 24 }).catch(() => ({ success: true, products: [] })),
        ]);

        if (catsRes.categories) setCategories(catsRes.categories);
        if (prodsRes.products && prodsRes.products.length > 0) {
          const all = prodsRes.products;
          setFeaturedProducts(all.slice(0, 4));
          setBestSellers(all.slice(4, 8));
          setTrending(all.slice(8, 12));
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white overflow-hidden py-16 sm:py-24">
        {/* Decorative Grid glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="max-w-2xl space-y-6 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Next-Gen Indian E-Commerce Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Synchronize Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Shopping Desires.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Discover authentic electronics, fashion, home essentials, and fitness gear with instant OpenSearch fuzzy discovery, atomic stock reservation, and real-time WhatsApp order tracking.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <Link
                to="/search"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-full font-bold text-sm transition shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
              >
                <span>Explore Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/category/electronics"
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3.5 rounded-full font-bold text-sm transition backdrop-blur-md"
              >
                <span>Electronics 25% OFF</span>
              </Link>
            </div>
          </div>

          {/* Hero Feature Card */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                Real-Time Cloud Platform
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-semibold text-white">⚡ Aiven OpenSearch</span>
                <span className="text-emerald-400 font-mono">Fuzzy Index Ready</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-semibold text-white">📦 Aiven Kafka Outbox</span>
                <span className="text-purple-400 font-mono">5 Event Topics Live</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-semibold text-white">💳 Razorpay Gateway</span>
                <span className="text-blue-400 font-mono">UPI & Cards Enabled</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-semibold text-white">🤖 WhatsApp AI Assistant</span>
                <span className="text-green-400 font-mono">Gemini 2.5 Active</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shop by Categories</h2>
            <p className="text-xs text-slate-500">Explore our handpicked catalogues across 6 prime Indian departments</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-blue-600 hover:underline flex items-center">
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-400 transition text-center p-4 flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-slate-100 group-hover:border-blue-600 transition">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-400 mt-0.5">Explore Items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Products</h2>
          </div>
          <Link to="/search" className="text-xs font-bold text-blue-600 hover:underline flex items-center">
            Browse All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Promotional Mid Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Limited Period Offer
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Up to 45% OFF on Premium Lifestyle & Kitchen
            </h3>
            <p className="text-sm text-purple-200 max-w-lg">
              Prestige cookware, boAt audio, FabIndia kurtas, and ON Gold Standard Whey Protein dispatched from regional fulfillment centers within 24 hours.
            </p>
          </div>
          <Link
            to="/search?maxPrice=3000"
            className="shrink-0 bg-white text-purple-900 hover:bg-purple-50 font-black px-8 py-4 rounded-full text-sm transition shadow-lg"
          >
            Shop Deals Under ₹3,000
          </Link>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Best Sellers</h2>
          </div>
          <Link to="/search" className="text-xs font-bold text-blue-600 hover:underline flex items-center">
            See More <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Trending Across India</h2>
          </div>
          <Link to="/search" className="text-xs font-bold text-blue-600 hover:underline flex items-center">
            Explore All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trending.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    </div>
  );
};
