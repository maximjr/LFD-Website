import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Activation() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!code.trim()) {
      setError('Please enter the activation code');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const token = await currentUser.getIdToken();
      let response;
      try {
        response = await fetch('/api/activations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            code: code.trim(),
          }),
        });
      } catch (networkError) {
        console.error("Network error:", networkError);
        throw new Error("Network error. Please check your connection and try again.");
      }

      if (response) {
        console.log("Response status:", response.status);
      }

      if (!response || response.status === 204) {
        console.warn("Empty response received");
        throw new Error("Received an empty response from the server.");
      }

      let data = null;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          throw new Error("The server returned an invalid response format.");
        }
      } else {
        console.warn("Response is not JSON");
        throw new Error("The server returned a non-JSON response.");
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error?.details || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/live-seminars');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Invalid activation code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please log in to activate your account</h2>
          <button 
            onClick={() => navigate('/login')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="bg-emerald-900 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400 rounded-full blur-[80px]"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-emerald-500/30">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Account Activation</h1>
            <p className="text-emerald-200/80 font-medium">Enter the code sent to your email</p>
          </div>
        </div>

        <div className="p-10">
          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
              <p className="text-slate-600 mb-8">Your account has been successfully activated. Redirecting you to the seminars...</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </motion.div>
          ) : (
            <form onSubmit={(e) => handleVerify(e).catch(console.error)} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Activation Code
                </label>
                <input 
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="E.G. ABX742"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-center text-2xl font-black tracking-widest placeholder:text-slate-300 placeholder:tracking-normal"
                  maxLength={8}
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={isVerifying}
                className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    Activate Account <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>

              <p className="text-center text-slate-400 text-sm font-medium">
                Didn't receive a code? <br className="sm:hidden" />
                <button 
                  type="button"
                  onClick={() => navigate('/seminars')}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Contact Support
                </button>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
