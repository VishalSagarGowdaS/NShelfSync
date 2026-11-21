import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export const PaymentResultPage: React.FC = () => {
  const [params] = useSearchParams();
  const status = params.get('status') || 'success';
  const orderNumber = params.get('orderNumber') || 'SS1025';
  const method = params.get('method') || 'razorpay';
  const error = params.get('error') || '';

  const isSuccess = status === 'success';

  return (
    <div className="max-w-xl mx-auto my-16 px-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        
        {/* Status Icon */}
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center">
          {isSuccess ? (
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isSuccess ? 'Order Placed & Confirmed!' : 'Payment Failed'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {isSuccess
              ? `Your ShelfSync order #${orderNumber} has been verified and stock reserved.`
              : error || 'Payment could not be completed. Your stock reservation has been released.'}
          </p>
        </div>

        {/* Order Details Card */}
        {isSuccess && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Reference:</span>
              <span className="font-mono font-bold text-slate-900">#{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Gateway:</span>
              <span className="font-semibold text-slate-900 uppercase">{method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">WhatsApp Notification:</span>
              <span className="text-emerald-600 font-bold">Dispatched via Meta Cloud API</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {isSuccess ? (
            <>
              <Link
                to={`/orders/${orderNumber}`}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
              >
                <span>Track Real-Time Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-bold text-xs transition flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/checkout"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs transition shadow-md"
              >
                Retry Payment
              </Link>
              <Link
                to="/cart"
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-bold text-xs transition"
              >
                Return to Cart
              </Link>
            </>
          )}
        </div>

        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>ShelfSync Guarantee • Pan-India Customer Support</span>
        </div>
      </div>
    </div>
  );
};
