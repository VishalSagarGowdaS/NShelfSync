import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Package, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const res = await api.getMyOrders();
        if (res.orders) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.warn('Orders fetch note:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Order History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View past purchases, invoice summaries, and real-time shipment tracking
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-50 p-12 text-center rounded-3xl border border-slate-200 space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't placed any orders with ShelfSync yet. Explore our top Indian electronics and fashion deals!
          </p>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-xs font-bold transition shadow"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    #{order.order_number}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>

                <div className="text-sm font-black text-slate-900">
                  Total: ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  <span className="ml-2 text-xs font-semibold text-emerald-600">
                    ({order.payment_status === 'CAPTURED' ? 'Paid via Razorpay' : 'Payment: ' + order.payment_status})
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Link
                  to={`/orders/${order.order_number}`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Package className="w-4 h-4" />
                  <span>Track Package</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
