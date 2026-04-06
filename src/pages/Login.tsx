import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export default function Login() {
  const { currentUser, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create it
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName || 'Google User',
            email: user.email,
            role: 'user',
            createdAt: serverTimestamp()
          });
        }
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.GET, 'users');
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        if (password !== repeatPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name });
          
          // Create user document in Firestore
          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              displayName: name,
              email: email,
              role: 'user',
              createdAt: serverTimestamp()
            });
          } catch (firestoreErr) {
            handleFirestoreError(firestoreErr, OperationType.WRITE, 'users');
          }
        }
        navigate('/');
      }
    } catch (err: any) {
      if (isLogin) {
        setError('Password or Email Incorrect');
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError('User already exist. Log in?');
        } else {
          setError(err.message || 'Failed to create an account');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://i.imgur.com/Ejjufjy.png" 
          alt="Login background" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-900/40"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 relative z-10"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-slate-50 p-2">
              <img 
                src="https://i.imgur.com/7ryePWK.png" 
                alt="Optimal Health Care Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-1.5">
              <span className="text-[#00a651]">Optimal</span>
              <span className="text-[#9333ea]">Health</span>
              <span className="text-[#00a651]">Care</span>
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="mt-4 text-slate-500 font-medium">
            {isForgotPassword
              ? 'Enter your email address and we will send you a link to reset your password.'
              : (isLogin 
                ? 'Log in to access your health seminars and personalized dashboard.' 
                : 'Sign up to register for exclusive health seminars and training programs.')}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            We sent you a password change link to {email}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => {
          if (isForgotPassword) {
            handleResetPassword(e).catch(console.error);
          } else {
            handleSubmit(e).catch(console.error);
          }
        }}>
          <div className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-4 pl-12 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all sm:text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-4 pl-12 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all sm:text-sm font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                    Password
                  </label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setResetSent(false);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required={!isForgotPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-4 pl-12 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all sm:text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
            {!isLogin && !isForgotPassword && (
              <div>
                <label htmlFor="repeat-password" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Repeat Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="repeat-password"
                    name="repeat-password"
                    type="password"
                    autoComplete="new-password"
                    required={!isLogin}
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-4 pl-12 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all sm:text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          {isLogin && !isForgotPassword && (
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded-lg transition-all cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm font-bold text-slate-600 cursor-pointer">
                Keep me logged in
              </label>
            </div>
          )}

          <div>
            {resetSent ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setResetSent(false);
                  setError('');
                }}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-xl shadow-emerald-500/20"
              >
                Sign In
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-slate-900 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-xl shadow-slate-900/10 hover:shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isForgotPassword ? 'Get Reset Link' : (isLogin ? 'Log In' : 'Sign Up'))}
                {!loading && !isForgotPassword && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            )}
          </div>
        </form>
        
        {!isForgotPassword && !resetSent && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => handleGoogleSignIn().catch(console.error)}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3.5 border border-slate-200 rounded-2xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <img src="https://i.imgur.com/xtjJpWr.png" alt="Google" className="h-5 w-5 mr-3" referrerPolicy="no-referrer" />
                Google
              </button>
            </div>
          </div>
        )}

        {!resetSent && (
          <div className="text-center mt-10">
            <p className="text-slate-500 font-medium">
              {isForgotPassword ? "Remember your password? " : (isLogin ? "Don't have an account? " : "Already have an account? ")}
              <button 
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                  } else {
                    setIsLogin(!isLogin);
                  }
                  setError('');
                }}
                className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors underline decoration-2 underline-offset-4 decoration-emerald-500/20 hover:decoration-emerald-500"
              >
                {isForgotPassword ? 'Log in here' : (isLogin ? 'Sign up here' : 'Log in here')}
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
