import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  limit,
  serverTimestamp,
  deleteDoc
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
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Key,
  Copy,
  Check,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import LiveStreamControl from './LiveStreamControl';

interface Subscription {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  planType: 'monthly' | 'yearly';
  paymentMethod: string;
  status: 'pending' | 'active' | 'expired' | 'deleted';
  createdAt: Timestamp;
  startDate?: Timestamp;
  expiryDate?: Timestamp;
  deleted?: boolean;
  deletedAt?: Timestamp | null;
}

interface ActivationKey {
  id: string;
  userId: string;
  email: string;
  key: string;
  status: 'unused' | 'used';
  emailSent: boolean;
  emailSentAt?: Timestamp;
  emailAttempts: number;
  emailStatus: 'pending' | 'sent' | 'retrying' | 'failed';
  deleted?: boolean;
  createdAt?: Timestamp;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'livestream' | 'trash'>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activationKeys, setActivationKeys] = useState<ActivationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired' | 'deleted'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<{ key: string, email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const logAction = async (action: string, userId: string | undefined, subscriptionId: string) => {
    try {
      await addDoc(collection(db, "adminLogs"), {
        action,
        userId: userId || 'unknown',
        subscriptionId,
        performedBy: auth.currentUser?.uid || 'admin',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log action", e);
    }
  };

  useEffect(() => {
    const qSubs = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
    const qKeys = query(collection(db, 'activationKeys'), orderBy('createdAt', 'desc'));
    
    const unsubscribeSubs = onSnapshot(qSubs, (snapshot) => {
      const subs: Subscription[] = [];
      snapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() } as Subscription);
      });
      setSubscriptions(subs);
    }, (err) => {
      console.error("Firestore error (subs):", err);
      setError("Failed to fetch subscriptions.");
    });

    const unsubscribeKeys = onSnapshot(qKeys, (snapshot) => {
      const keys: ActivationKey[] = [];
      snapshot.forEach((doc) => {
        keys.push({ id: doc.id, ...doc.data() } as ActivationKey);
      });
      setActivationKeys(keys);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error (keys):", err);
      setLoading(false);
    });

    return () => {
      unsubscribeSubs();
      unsubscribeKeys();
    };
  }, []);

  const handleResendEmail = async (keyId: string) => {
    try {
      setProcessingId(keyId);
      await updateDoc(doc(db, 'activationKeys', keyId), {
        emailSent: false,
        emailStatus: 'pending',
        emailAttempts: 0 // Reset attempts on manual resend
      });
      alert("Email resend triggered successfully!");
    } catch (err) {
      console.error("Error triggering resend:", err);
      alert("Failed to trigger email resend.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunMaintenance = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Run System Maintenance',
      message: 'Are you sure you want to run system maintenance? This will clean up old records and retry failed emails.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch('/api/admin/maintenance', {
            method: 'POST',
          });
          
          const data = await response.json();
          if (data.success) {
            alert("Maintenance completed successfully! Check the server logs for details.");
          } else {
            alert("Maintenance failed: " + data.message);
          }
        } catch (error) {
          console.error("Error triggering maintenance:", error);
          alert("An error occurred while triggering maintenance.");
        }
      }
    });
  };

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
    setProcessingId(id);
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
    } finally {
      setProcessingId(null);
    }
  };

  const handleSoftDelete = async (sub: Subscription) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deactivate User',
      message: 'Are you sure you want to deactivate this user? They will lose access to the platform.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setProcessingId(sub.id);
        try {
          const subRef = doc(db, 'subscriptions', sub.id);
          await updateDoc(subRef, {
            status: 'deleted',
            deleted: true,
            deletedAt: serverTimestamp()
          });

          // Soft delete associated activation keys
          const userKeys = activationKeys.filter(k => k.userId === sub.userId);
          for (const key of userKeys) {
            await updateDoc(doc(db, 'activationKeys', key.id), {
              deleted: true
            });
          }

          await logAction('soft_delete', sub.userId, sub.id);
          alert("User deactivated successfully");
        } catch (err) {
          console.error("Deactivation error:", err);
          alert("Error deactivating user");
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleRestore = async (sub: Subscription) => {
    setProcessingId(sub.id);
    try {
      const subRef = doc(db, 'subscriptions', sub.id);
      await updateDoc(subRef, {
        status: 'active',
        deleted: false,
        deletedAt: null
      });

      // Restore associated activation keys
      const userKeys = activationKeys.filter(k => k.userId === sub.userId);
      for (const key of userKeys) {
        await updateDoc(doc(db, 'activationKeys', key.id), {
          deleted: false
        });
      }

      await logAction('restore', sub.userId, sub.id);
      alert("User restored successfully");
    } catch (err) {
      console.error("Restore error:", err);
      alert("Error restoring user");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (sub: Subscription) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete User',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setProcessingId(sub.id);
        try {
          // Delete associated activation keys
          const userKeys = activationKeys.filter(k => k.userId === sub.userId);
          for (const key of userKeys) {
            await deleteDoc(doc(db, 'activationKeys', key.id));
          }

          // Delete subscription
          await deleteDoc(doc(db, 'subscriptions', sub.id));

          await logAction('permanent_delete', sub.userId, sub.id);
          alert("User permanently deleted");
        } catch (err) {
          console.error("Delete error:", err);
          alert("Error deleting user");
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const generateUniqueKey = (plan: 'monthly' | 'yearly') => {
    const prefix = plan === "monthly" ? "OPT" : "HLT";
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${randomPart}`;
  };

  const handleGenerateKey = async (sub: Subscription) => {
    if (!sub.userId) {
      alert("Cannot generate key: Missing User ID for this subscription request.");
      return;
    }

    setProcessingId(sub.id);
    try {
      const key = generateUniqueKey(sub.planType);
      const duration = sub.planType === "monthly" ? 30 : 365;

      await addDoc(collection(db, "activationKeys"), {
        userId: sub.userId,
        email: sub.email,
        plan: sub.planType,
        durationDays: duration,
        key,
        status: "unused",
        emailSent: false,
        emailStatus: "pending",
        emailAttempts: 0,
        createdAt: serverTimestamp(),
        expiresAt: null
      });

      setGeneratedKey({ key, email: sub.email });
    } catch (err) {
      console.error("Key generation error:", err);
      alert("Failed to generate activation key.");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Plan", "Status", "Expiry"];
    const rows = filteredSubscriptions.map(sub => [
      `"${sub.name}"`,
      `"${sub.email}"`,
      `"${sub.phone}"`,
      `"${sub.planType}"`,
      `"${sub.status}"`,
      `"${sub.expiryDate ? sub.expiryDate.toDate().toLocaleDateString() : "N/A"}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredSubscriptions = subscriptions.filter(sub => {
    // Filter by tab (trash vs active)
    if (activeTab === 'trash' && !sub.deleted) return false;
    if (activeTab === 'subscriptions' && sub.deleted) return false;

    const matchesSearch = 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.planType === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

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
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage Optimal Healthcare platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRunMaintenance}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
              title="Run System Maintenance"
            >
              <RefreshCw size={18} />
              Run Maintenance
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'subscriptions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Users
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'trash'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deleted Users (Trash)
          </button>
          <button
            onClick={() => setActiveTab('livestream')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'livestream'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Video className="w-4 h-4" />
            Live Stream Control
          </button>
        </div>

        {activeTab === 'livestream' ? (
          <LiveStreamControl />
        ) : (
          <>
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{subscriptions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Active Users</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{subscriptions.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{subscriptions.filter(s => s.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Expired</p>
            <p className="text-3xl font-bold text-rose-600 mt-1">{subscriptions.filter(s => s.status === 'expired').length}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <select 
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-gray-700"
            >
              <option value="all">All Plans</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPlanFilter('all');
              }}
              className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
              title="Reset Filters"
            >
              <RefreshCw size={20} />
            </button>

            <button 
              onClick={exportToCSV}
              disabled={filteredSubscriptions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto lg:ml-0"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Confirm Modal */}
          <AnimatePresence>
            {confirmModal.isOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
                  <p className="text-slate-600 mb-6">{confirmModal.message}</p>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                      className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmModal.onConfirm}
                      className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated Key Modal */}
          <AnimatePresence>
            {generatedKey && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Key size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Key Generated!</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Unique key for <strong>{generatedKey.email}</strong>
                  </p>
                  
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 mb-6 relative group">
                    <span className="text-2xl font-black tracking-widest text-slate-900">
                      {generatedKey.key}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(generatedKey.key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    </button>
                  </div>

                  <button 
                    onClick={() => setGeneratedKey(null)}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all"
                  >
                    Done
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email & Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence mode='popLayout'>
                  {filteredSubscriptions.map((sub) => (
                    <motion.tr 
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {sub.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            {sub.email}
                          </span>
                          {(() => {
                            const userKeys = activationKeys.filter(k => k.userId === sub.userId);
                            const latestKey = userKeys.length > 0 ? userKeys.reduce((prev, current) => {
                              const prevTime = prev.createdAt?.toMillis() || 0;
                              const currTime = current.createdAt?.toMillis() || 0;
                              return prevTime > currTime ? prev : current;
                            }) : null;

                            if (!latestKey) return null;

                            return (
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-1.5">
                                  {(() => {
                                    switch (latestKey.emailStatus) {
                                      case 'sent':
                                        return (
                                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5" title={`Sent at: ${latestKey.emailSentAt?.toDate().toLocaleString()}`}>
                                            <Check size={10} /> Email Sent
                                          </span>
                                        );
                                      case 'failed':
                                        return (
                                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                                            <XCircle size={10} /> Failed ({latestKey.emailAttempts})
                                          </span>
                                        );
                                      case 'retrying':
                                        return (
                                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                                            <RefreshCw size={10} className="animate-spin" /> Retrying ({latestKey.emailAttempts})
                                          </span>
                                        );
                                      default:
                                        return (
                                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                                            <Clock size={10} /> Pending
                                          </span>
                                        );
                                    }
                                  })()}
                                </div>
                                {latestKey.emailStatus !== 'sent' && (
                                  <button 
                                    onClick={() => handleResendEmail(latestKey.id)}
                                    disabled={processingId === latestKey.id}
                                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline text-left disabled:opacity-50"
                                  >
                                    Resend Email
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {sub.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {sub.planType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          {sub.expiryDate ? (
                            <span className="text-emerald-600 font-bold">
                              {sub.expiryDate.toDate().toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Not set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {activeTab === 'trash' ? (
                            <>
                              <button 
                                onClick={() => handleRestore(sub)}
                                disabled={processingId === sub.id}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === sub.id ? '...' : 'Restore'}
                              </button>
                              <button 
                                onClick={() => handlePermanentDelete(sub)}
                                disabled={processingId === sub.id}
                                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === sub.id ? '...' : 'Delete'}
                              </button>
                            </>
                          ) : (
                            <>
                              {sub.status !== 'active' && (
                                <>
                                  <button 
                                    onClick={() => handleActivate(sub.id, sub.planType)}
                                    disabled={processingId === sub.id}
                                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processingId === sub.id ? '...' : 'Activate'}
                                  </button>
                                  <button 
                                    onClick={() => handleGenerateKey(sub)}
                                    disabled={processingId === sub.id}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    title="Generate Unique Activation Key"
                                  >
                                    <Key size={12} /> Key
                                  </button>
                                </>
                              )}
                              {sub.status === 'active' && (
                                <button 
                                  onClick={() => handleSoftDelete(sub)}
                                  disabled={processingId === sub.id}
                                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingId === sub.id ? '...' : 'Deactivate'}
                                </button>
                              )}
                              <button 
                                onClick={() => handlePermanentDelete(sub)}
                                disabled={processingId === sub.id}
                                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === sub.id ? '...' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredSubscriptions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? "No subscriptions match your filters." 
                        : "No subscription requests found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
