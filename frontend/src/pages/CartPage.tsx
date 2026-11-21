import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, isLoading } = useCart();
  const navigate = useNavigate();

  if (isLoading && !cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 rounded w-1/4"></div>
        <div className="h-48 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Looks like you haven't added any items to your cart yet. Explore our verified Indian catalogue!
        </p>
        <Link
          to="/search"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-xs font-bold transition shadow-md"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Shopping Cart ({cart.itemCount} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.item_id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4"
            >
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <Link to={`/products/${item.slug}`} className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{item.brand}</span>
                  <Link to={`/products/${item.slug}`}>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="text-xs font-black text-slate-900">
                    ₹{Number(item.unit_price).toLocaleString('en-IN')}
                    {item.discount_percent > 0 && (
                      <span className="ml-2 text-[10px] text-slate-400 line-through">
                        ₹{Number(item.base_price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity & Remove */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4">
                <div className="flex items-center border border-slate-300 rounded-full bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                    disabled={item.quantity >= item.available_stock}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-black text-slate-900 w-24 text-right">
                  ₹{Number(item.total_item_price).toLocaleString('en-IN')}
                </div>

                <button
                  onClick={() => removeFromCart(item.item_id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-full transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6 h-fit shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Total (MRP)</span>
              <span className="font-semibold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-emerald-600">
              <span>Catalogue Discount</span>
              <span className="font-semibold">-₹{cart.discount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between">
              <span>Standard Delivery</span>
              <span>
                {cart.deliveryCharge === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase">Free</span>
                ) : (
                  <span className="font-semibold text-slate-900">₹{cart.deliveryCharge}</span>
                )}
              </span>
            </div>

            {cart.deliveryCharge > 0 && (
              <p className="text-[11px] text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-100 flex items-center">
                <Truck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Add ₹{(cart.freeDeliveryThreshold - (cart.subtotal - cart.discount)).toLocaleString('en-IN')} more for FREE delivery!
              </p>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
              <span>Final Payable Amount</span>
              <span className="text-lg text-blue-600">₹{cart.finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold text-sm transition shadow-lg flex items-center justify-center space-x-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>100% Encrypted Payment via Razorpay</span>
          </div>
        </div>

      </div>
    </div>
  );
};
