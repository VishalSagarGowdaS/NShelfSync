import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Truck, ShieldCheck, Heart, ShoppingBag, ArrowLeft, Check, AlertCircle, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        setIsLoading(true);
        const res = await api.getProductBySlug(slug);
        if (res.product) {
          setProduct(res.product);
          setSelectedImage(res.product.image_url || res.product.images?.[0]?.image_url || '');
        }
      } catch (err) {
        console.warn('Error loading product details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-slate-100 rounded-3xl aspect-square"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded w-3/4"></div>
            <div className="h-6 bg-slate-100 rounded w-1/4"></div>
            <div className="h-24 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-slate-50 rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Product not found</h2>
        <Link to="/" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
          Return to ShelfSync Storefront
        </Link>
      </div>
    );
  }

  const discountAmount = product.discount_percent > 0
    ? Math.round((product.base_price * product.discount_percent) / 100)
    : 0;
  const finalPrice = product.final_price || (product.base_price - discountAmount);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      await addToCart(product.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setIsAdding(true);
      await addToCart(product.id, quantity);
      navigate('/checkout');
    } catch (err: any) {
      alert(err.message || 'Failed to process Buy Now');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
            <img
              src={selectedImage || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discount_percent > 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md">
                {product.discount_percent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    selectedImage === img.image_url ? 'border-blue-600' : 'border-slate-200'
                  }`}
                >
                  <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                {product.brand}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 leading-snug">
                {product.name}
              </h1>
            </div>

            {/* Rating & Review */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current mr-1 text-emerald-600" />
                <span>{product.rating ? Number(product.rating).toFixed(1) : '4.5'}</span>
              </div>
              <span className="text-xs text-slate-500">
                {product.review_count ? product.review_count.toLocaleString('en-IN') : '1.2k'} verified customer reviews
              </span>
            </div>

            {/* Pricing */}
            <div className="pt-2 pb-4 border-y border-slate-100 flex items-baseline space-x-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{Number(finalPrice).toLocaleString('en-IN')}
              </span>
              {product.discount_percent > 0 && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    ₹{Number(product.base_price).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    You save ₹{discountAmount.toLocaleString('en-IN')} ({product.discount_percent}% OFF)
                  </span>
                </>
              )}
            </div>

            {/* Stock & Warehouse */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                {product.in_stock ? (
                  <span className="font-bold text-emerald-600 flex items-center">
                    <Check className="w-4 h-4 mr-1 text-emerald-600" /> In Stock ({product.stock} units ready to dispatch)
                  </span>
                ) : (
                  <span className="font-bold text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-red-500" /> Currently Out of Stock
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Dispatches from Regional Hub (Mumbai / Delhi NCR Express Fulfillment)</span>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
              <p>{product.description}</p>
            </div>

            {/* Trust Points */}
            <div className="grid grid-cols-2 gap-3 py-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Free delivery on orders above ₹999</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>100% Original & Razorpay Protected</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-full overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-1 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  -
                </button>
                <span className="px-4 py-1 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3.5 py-1 text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock || isAdding}
                className={`flex-1 py-3.5 rounded-full font-bold text-sm transition flex items-center justify-center space-x-2 shadow-md ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : !product.in_stock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Shopping Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.in_stock || isAdding}
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full font-bold text-sm transition shadow-md disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="pt-12 border-t border-slate-200">
        <h3 className="text-xl font-black text-slate-900 mb-6">Customer Ratings & Reviews</h3>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{rev.author_name}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Verified Buyer
                    </span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-800">{rev.title}</h4>
                <p className="text-xs text-slate-600">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No customer reviews yet. Be the first verified buyer to review this product!</p>
        )}
      </div>
    </div>
  );
};
