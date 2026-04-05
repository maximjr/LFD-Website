import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  addDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  LogOut,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface Subscription {
  id: string;
  name: string;
  email: string;
  phone: string;
  planType: 'monthly' | 'yearly';
  paymentMethod: string;
  status: 'pending' | 'active' | 'expired';
  createdAt: Timestamp;
  startDate?: Timestamp;
  expiryDate?: Timestamp;
}

const AdminDashboard: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: Subscription[] = [];
      snapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() } as Subscription);
      });
      setSubscriptions(subs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Failed to fetch subscriptions. Please check your permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateMockData = async () => {
    const mockData = [
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1 234 567 890",
        planType: "monthly",
        paymentMethod: "Credit Card",
        status: "pending",
        createdAt: Timestamp.now()
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+1 987 654 321",
        planType: "yearly",
        paymentMethod: "PayPal",
        status: "active",
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
        startDate: Timestamp.fromDate(new Date(Date.now() - 86400000)),
        expiryDate: Timestamp.fromDate(new Date(Date.now() + 31536000000))
      },
      {
        name: "Robert Johnson",
        email: "robert@example.com",
        phone: "+1 555 012 345",
        planType: "monthly",
        paymentMethod: "Bank Transfer",
        status: "expired",
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3000000000)),
        startDate: Timestamp.fromDate(new Date(Date.now() - 3000000000)),
        expiryDate: Timestamp.fromDate(new Date(Date.now() - 1000000))
      }
    ];

    try {
      for (const data of mockData) {
        await addDoc(collection(db, 'subscriptions'), data);
      }
      alert("Mock data generated successfully!");
    } catch (err) {
      console.error("Error generating mock data:", err);
      alert("Failed to generate mock data.");
    }
  };

  const calculateExpiry = (plan: 'monthly' | 'yearly') => {
    const date = new Date();
    if (plan === 'monthly') {
      date.setDate(date.getDate() + 30);
    } else {
      date.setDate(date.getDate() + 365);
    }
    return Timestamp.fromDate(date);
  };

  const handleActivate = async (id: string, planType: 'monthly' | 'yearly') => {
    try {
      const subRef = doc(db, 'subscriptions', id);
      await updateDoc(subRef, {
        status: 'active',
        startDate: Timestamp.now(),
        expiryDate: calculateExpiry(planType)
      });
    } catch (err) {
      console.error("Activation error:", err);
      alert("Failed to activate subscription.");
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const subRef = doc(db, 'subscriptions', id);
      await updateDoc(subRef, {
        status: 'expired'
      });
    } catch (err) {
      console.error("Deactivation error:", err);
      alert("Failed to deactivate subscription.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1 w-fit"><CheckCircle size={14} /> Active</span>;
      case 'expired':
        return <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1 w-fit"><XCircle size={14} /> Expired</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1 w-fit"><Clock size={14} /> Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" />
              Admin Activation Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage Optimal Healthcare subscriptions and user access.</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </header>

        {subscriptions.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-8 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">No Data Found</h3>
              <p className="text-blue-700 text-sm">Would you like to generate some mock subscription requests for testing?</p>
            </div>
            <button 
              onClick={generateMockData}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Generate Mock Data
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{subscriptions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Active Users</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{subscriptions.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Pending Activation</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{subscriptions.filter(s => s.status === 'pending').length}</p>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan & Payment</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence mode='popLayout'>
                  {subscriptions.map((sub) => (
                    <motion.tr 
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <User size={14} className="text-gray-400" /> {sub.name}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Mail size={14} className="text-gray-400" /> {sub.email}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Phone size={14} className="text-gray-400" /> {sub.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5 capitalize">
                            <Calendar size={14} className="text-gray-400" /> {sub.planType} Plan
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <CreditCard size={14} className="text-gray-400" /> {sub.paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                          <span>Requested: {sub.createdAt.toDate().toLocaleDateString()}</span>
                          {sub.expiryDate && (
                            <span className="text-blue-600 font-medium">Expires: {sub.expiryDate.toDate().toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {sub.status !== 'active' && (
                            <button 
                              onClick={() => handleActivate(sub.id, sub.planType)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Activate
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button 
                              onClick={() => handleDeactivate(sub.id)}
                              className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {subscriptions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No subscription requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
