import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Headphones, Database, Cpu, Search } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Propositions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Pan-India Express</h4>
              <p className="text-xs text-slate-400">Hubs in Mumbai, Delhi & BLR</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Razorpay Verified</h4>
              <p className="text-xs text-slate-400">UPI, RuPay, Cards & NetBanking</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <RotateCcw className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">7 Days Easy Return</h4>
              <p className="text-xs text-slate-400">Hassle-free refunds & pickups</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Headphones className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">WhatsApp AI Support</h4>
              <p className="text-xs text-slate-400">24x7 intelligent assistance</p>
            </div>
          </div>
        </div>

        {/* Links & Cloud Tech Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base">
                SS
              </div>
              <span className="text-xl font-black text-white">ShelfSync</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              ShelfSync is a modern, high-velocity Indian e-commerce platform built on an event-driven microservices architecture. Powered by Aiven Managed Cloud, Razorpay payments, and Gemini AI.
            </p>
            
            {/* Tech Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center text-[11px] bg-slate-800 text-blue-300 px-2.5 py-1 rounded-md border border-slate-700">
                <Database className="w-3 h-3 mr-1 text-blue-400" /> Aiven PostgreSQL
              </span>
              <span className="inline-flex items-center text-[11px] bg-slate-800 text-purple-300 px-2.5 py-1 rounded-md border border-slate-700">
                <Cpu className="w-3 h-3 mr-1 text-purple-400" /> Aiven Kafka
              </span>
              <span className="inline-flex items-center text-[11px] bg-slate-800 text-amber-300 px-2.5 py-1 rounded-md border border-slate-700">
                <Search className="w-3 h-3 mr-1 text-amber-400" /> Aiven OpenSearch
              </span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Top Categories</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/category/electronics" className="hover:text-blue-400 transition">Electronics & Gadgets</Link></li>
              <li><Link to="/category/fashion" className="hover:text-blue-400 transition">Indian Fashion & Ethnic</Link></li>
              <li><Link to="/category/home-kitchen" className="hover:text-blue-400 transition">Home & Kitchen</Link></li>
              <li><Link to="/category/grocery" className="hover:text-blue-400 transition">Daily Grocery Staples</Link></li>
              <li><Link to="/category/beauty-personal-care" className="hover:text-blue-400 transition">Beauty & Wellness</Link></li>
              <li><Link to="/category/sports-fitness" className="hover:text-blue-400 transition">Sports & Gym Fitness</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Customer Care</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/orders" className="hover:text-blue-400 transition">Track Your Order</Link></li>
              <li><Link to="/cart" className="hover:text-blue-400 transition">View Shopping Cart</Link></li>
              <li><Link to="/profile" className="hover:text-blue-400 transition">Saved Delivery Addresses</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Account Sign In</Link></li>
              <li><a href="#whatsapp" className="hover:text-blue-400 transition">WhatsApp Support</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Payment Modes</h5>
            <p className="text-xs text-slate-400 mb-3">100% Secure Checkout via Razorpay Payment Gateway</p>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">UPI</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">Google Pay</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">PhonePe</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">Paytm</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">RuPay</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">Visa</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">COD</span>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© 2026 ShelfSync Technologies Private Limited. All Rights Reserved. Engineered with Pride in India.</p>
        </div>
      </div>
    </footer>
  );
};
