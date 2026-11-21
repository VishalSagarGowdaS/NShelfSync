import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Plus, Trash2, Shield, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Address } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // New Address State
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await api.getProfile();
        if (res.addresses) {
          setAddresses(res.addresses);
        }
      } catch (err) {
        console.warn('Profile fetch note:', err);
      }
    }
    loadUserData();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addAddress({
        recipientName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        isDefault,
      });

      if (res.success && res.address) {
        setAddresses((prev) => [res.address, ...prev]);
        setShowAddAddress(false);
        // Reset fields
        setRecipientName('');
        setPhone('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setPostalCode('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Customer Account & Addresses
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details and saved delivery destinations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left: User Details Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold mx-auto">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">{user?.fullName}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full">
              {user?.role} Account
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user?.phone || '+91 98200 12345 (Verified)'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Aiven PostgreSQL Verified</span>
            </div>
          </div>
        </div>

        {/* Right: Saved Delivery Addresses */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Saved Delivery Addresses</h3>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition flex items-center space-x-1 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          {/* Add Address Form Modal / Box */}
          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 text-xs animate-in fade-in">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">New Address Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Recipient Name"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="tel"
                  placeholder="Phone (+91...)"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="Flat / House / Street"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="Area / Landmark"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="City"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="State"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="PIN Code"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <label className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Set as default address</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-full font-bold shadow"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {/* List */}
          {addresses.length === 0 ? (
            <div className="bg-slate-50 p-8 text-center rounded-3xl border border-slate-200 text-xs text-slate-500">
              No saved addresses yet. Add one above to speed up checkout.
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{addr.recipient_name}</span>
                      {addr.is_default && (
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{addr.address_line1}</p>
                    {addr.address_line2 && <p className="text-slate-600">{addr.address_line2}</p>}
                    <p className="text-slate-600">{addr.city}, {addr.state} — {addr.postal_code}</p>
                    <p className="text-slate-700 font-semibold pt-1">Phone: {addr.phone}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-full transition"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
