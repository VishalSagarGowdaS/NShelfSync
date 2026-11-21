import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, MapPin, ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      try {
        setIsLoading(true);
        const res = await api.getOrderDetails(orderNumber);
        if (res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        console.warn('Order fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 rounded w-1/3"></div>
        <div className="h-40 bg-slate-100 rounded-3xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-slate-50 rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <Link to="/orders" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
          Return to My Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Inventory reserved atomically' },
    { key: 'PACKED', label: 'Packed & Inspected', desc: 'Regional fulfillment center' },
    { key: 'SHIPPED', label: 'Shipped', desc: 'Dispatched via ShelfSync Express' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier agent on route' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over to customer' },
  ];

  const statusIndexMap: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    PACKED: 1,
    SHIPPED: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
  };

  const currentStep = statusIndexMap[order.status] ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link to="/orders" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Orders
      </Link>

      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Tracking Details</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Order #{order.order_number}
            </h1>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Total Amount</span>
            <span className="text-xl font-black text-slate-900">
              ₹{Number(order.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Milestone Stepper */}
        <div className="py-6">
          <div className="relative">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>

            <div className="relative z-10 flex justify-between">
              {steps.map((st, i) => {
                const isPassed = i <= currentStep;
                return (
                  <div key={st.key} className="flex flex-col items-center text-center max-w-[80px]">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                        isPassed
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-slate-400 border-2 border-slate-300'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <span className={`text-[11px] font-bold mt-2 ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Notice */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center space-x-3 text-xs text-emerald-800">
          <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">WhatsApp Updates Active:</span> Real-time shipment milestone notifications dispatched to{' '}
            <span className="font-mono font-bold">{order.shipping_snapshot?.phone || '+919820012345'}</span> via Meta Cloud API.
          </div>
        </div>
      </div>

      {/* Shipment Log & Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Tracking Timeline Log */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            Tracking Timeline
          </h3>

          <div className="space-y-4 text-xs">
            <div className="relative pl-6 pb-2 border-l-2 border-blue-600">
              <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-600"></div>
              <p className="font-bold text-slate-900">Current Status: {order.status}</p>
              <p className="text-slate-500">Regional Fulfillment Center, {order.shipping_snapshot?.city || 'Mumbai'}</p>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="relative pl-6 pb-2 border-l-2 border-slate-200">
              <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-slate-300"></div>
              <p className="font-bold text-slate-800">Order Placed & Stock Reserved</p>
              <p className="text-slate-500">PostgreSQL Transaction Committed & Kafka Outbox Emitted</p>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address & Carrier Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-purple-600" />
            Delivery Address
          </h3>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <p className="font-bold text-slate-900">{order.shipping_snapshot?.recipientName}</p>
            <p className="text-slate-600">{order.shipping_snapshot?.addressLine1}</p>
            {order.shipping_snapshot?.addressLine2 && (
              <p className="text-slate-600">{order.shipping_snapshot.addressLine2}</p>
            )}
            <p className="text-slate-600">
              {order.shipping_snapshot?.city}, {order.shipping_snapshot?.state} — {order.shipping_snapshot?.postalCode}
            </p>
            <p className="text-slate-700 font-semibold pt-1">Phone: {order.shipping_snapshot?.phone}</p>
          </div>

          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Logistics Carrier</span>
            <p className="font-bold text-slate-900">ShelfSync Express (Surface Air Combined)</p>
            <p className="text-[11px] font-mono text-blue-600 mt-0.5">
              Tracking ID: TRK{order.order_number}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
