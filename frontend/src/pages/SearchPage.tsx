import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search as SearchIcon, Database, ArrowUpDown } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';
import { Product } from '../types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [searchSource, setSearchSource] = useState<string>('opensearch');
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStockOnly = searchParams.get('inStockOnly') === 'true';
  const city = searchParams.get('city') || '';
  const sortBy = searchParams.get('sortBy') || '';

  const brands = ['boAt', 'Noise', 'OnePlus', 'Realme', 'ASUS', 'FabIndia', 'Levi\'s', 'Prestige', 'Pigeon', 'Fortune', 'Mamaearth', 'Boldfit'];
  const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad'];

  useEffect(() => {
    async function executeSearch() {
      try {
        setIsLoading(true);
        const params: Record<string, any> = {};
        if (query) params.q = query;
        if (category) params.category = category;
        if (brand) params.brand = brand;
        if (maxPrice) params.maxPrice = maxPrice;
        if (minRating) params.minRating = minRating;
        if (inStockOnly) params.inStockOnly = 'true';
        if (city) params.city = city;
        if (sortBy) params.sortBy = sortBy;

        const res = await api.search(params);
        if (res.products) {
          setProducts(res.products);
          setTotal(res.total || res.products.length);
          setSearchSource(res.source || 'opensearch');
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    executeSearch();
  }, [searchParams]);

  const updateFilter = (key: string, val: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!val) {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Source Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {query ? `Search Results for "${query}"` : 'All Products Catalogue'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {products.length} of {total} products
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Source indicator */}
          <span className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 font-mono">
            <Database className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Source: {searchSource === 'opensearch' ? 'Aiven OpenSearch (Fuzzy Index)' : 'Aiven PostgreSQL'}
          </span>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value || null)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Filter Sidebar */}
        <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-1.5 text-blue-600" /> Filters
            </span>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateFilter('inStockOnly', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>In-Stock Items Only</span>
            </label>
          </div>

          {/* Brand Filter */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Brands</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {brands.map((b) => (
                <label key={b} className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="brandFilter"
                    checked={brand === b}
                    onChange={() => updateFilter('brand', brand === b ? null : b)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Budget</h4>
            <div className="space-y-1 text-xs">
              {[1000, 2000, 5000, 10000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => updateFilter('maxPrice', maxPrice === amt.toString() ? null : amt.toString())}
                  className={`block w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    maxPrice === amt.toString()
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Under ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Warehouse City */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Regional Hub</h4>
            <div className="space-y-1 text-xs">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => updateFilter('city', city === c ? null : c)}
                  className={`block w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    city === c
                      ? 'bg-purple-600 text-white font-bold'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  📍 {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Customer Rating</h4>
            <div className="space-y-1 text-xs">
              {['4', '3'].map((r) => (
                <button
                  key={r}
                  onClick={() => updateFilter('minRating', minRating === r ? null : r)}
                  className={`block w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    minRating === r
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ★ {r}.0 Stars & above
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl h-80"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-4">
              <SearchIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching with typo tolerance like "bluetoth hedphones" or check out our popular categories.
              </p>
              <button
                onClick={clearFilters}
                className="px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
