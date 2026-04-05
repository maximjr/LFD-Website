import { CheckCircle2, Heart, Apple, ShieldCheck, Brain, Star, ChevronDown, ChevronUp, X, CreditCard, Phone, Mail, User, Key, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function Seminars() {
  const { currentUser } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subKey, setSubKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUserAccess() {
      if (!currentUser) {
        setSubscriptionStatus(null);
        setCheckingAccess(false);
        return;
      }

      try {
        const q = query(
          collection(db, "subscriptions"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const subData = querySnapshot.docs[0].data();
          const status = subData.status;

          if (status === "active") {
            const now = Timestamp.now();
            const expiry = subData.expiryDate as Timestamp;

            if (expiry && now.toMillis() < expiry.toMillis()) {
              setSubscriptionStatus("active");
            } else {
              setSubscriptionStatus("expired");
            }
          } else {
            setSubscriptionStatus(status);
          }
        } else {
          setSubscriptionStatus(null);
        }
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkUserAccess();
  }, [currentUser]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    paymentMethod: 'MTN MoMo' as 'MTN MoMo' | 'Orange Money'
  });

  const handleSubscribeClick = (plan: 'monthly' | 'yearly') => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setShowSubModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedPlan || !currentUser) return;

      const name = formData.name.trim();
      const phone = formData.phone.trim();
      const email = formData.email.trim();
      const location = formData.location.trim();
      const payment = formData.paymentMethod;

      if (!name || !phone || !email || !location || !payment) {
        alert("Please fill all required fields");
        return;
      }

      setIsSubmitting(true);

      await addDoc(collection(db, "subscriptions"), {
        userId: currentUser.uid,
        name,
        email,
        phone,
        location,
        planType: selectedPlan,
        paymentMethod: payment,
        status: "pending",
        createdAt: serverTimestamp()
      });

      setSubscriptionStatus("pending");
      setShowSubModal(false);
      setShowConfirmationModal(true);
      setIsSubmitting(false);

    } catch (error) {
      console.error("Submission Error:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleKeyActivation = () => {
    const key = subKey.trim().toUpperCase();
    
    if (key === "OPTIMAL26" || key === "HEALTH26") {
      // In a real automated system, the key would be validated against a database
      // and update the user's subscription status in Firestore.
      // For now, we'll simulate the "automated" feel by granting access.
      alert("Access granted!");
      setSubscriptionStatus('active');
      navigate('/live-seminars');
    } else {
      setKeyError("Invalid activation key");
    }
  };

  const faqs = [
    {
      q: "Who can attend these seminars?",
      a: "Our seminars are open to the general public, patients, and anyone interested in improving their health and well-being. No prior medical knowledge is required."
    },
    {
      q: "Are the seminars online or physical?",
      a: "We offer both online webinars and physical in-person seminars. You can choose the format that best suits your schedule and location when registering."
    },
    {
      q: "What is the refund policy?",
      a: "We offer a full refund if you cancel your registration at least 48 hours before the seminar begins. For premium subscriptions, you can cancel anytime."
    }
  ];

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {subscriptionStatus === "pending" ? (
        <section id="pendingMessage" className="flex-grow flex items-center justify-center py-24 bg-slate-50">
          <div className="container-custom text-center max-w-2xl">
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <h2 className="text-slate-900 mb-6">Awaiting Activation</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Your subscription request has been sent. <br />
              Please complete your payment and wait for activation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setShowKeyModal(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" /> Enter Activation Key
              </button>
              <button 
                onClick={() => {
                  setSubscriptionStatus(null);
                }}
                className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 px-8 rounded-2xl transition-all"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </section>
      ) : subscriptionStatus === "expired" ? (
        <section className="flex-grow flex items-center justify-center py-24 bg-slate-50">
          <div className="container-custom text-center max-w-2xl">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h2 className="text-slate-900 mb-6">Subscription Expired</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Your subscription has expired. Please renew to continue accessing our premium seminars.
            </p>
            <button 
              onClick={() => setSubscriptionStatus(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl"
            >
              View Plans
            </button>
          </div>
        </section>
      ) : (
        <div id="seminarContent">
          {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://i.imgur.com/Ejjufjy.png" 
            alt="Seminar background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-white mb-6 leading-tight">
              Health Seminars & <br className="hidden sm:block" />
              <span className="text-emerald-400">Training Programs</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-10">
              Learn how to prevent and manage chronic diseases effectively with our expert-led health education programs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setShowKeyModal(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" /> Enter Activation Key
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-slate-900 mb-4">Seminar Categories</h2>
            <p className="text-slate-600 text-lg">Explore our diverse range of health education topics.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Heart className="w-6 h-6" />, label: "Chronic Disease Management", color: "text-rose-500", bg: "bg-rose-50" },
              { icon: <Apple className="w-6 h-6" />, label: "Nutrition & Lifestyle", color: "text-emerald-500", bg: "bg-emerald-50" },
              { icon: <ShieldCheck className="w-6 h-6" />, label: "Preventive Healthcare", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: <Brain className="w-6 h-6" />, label: "Mental Health & Wellness", color: "text-purple-500", bg: "bg-purple-50" }
            ].map((cat, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-md transition-all flex flex-col items-center justify-center min-h-[200px]"
              >
                <div className={`w-16 h-16 ${cat.bg} ${cat.color} rounded-full flex items-center justify-center mb-6`}>
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{cat.label}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-slate-900 mb-4">Premium Subscription Plans</h2>
            <p className="text-slate-600 text-lg">Get unlimited access to all our premium health seminars, expert-led training programs, and exclusive resources.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 flex flex-col">
              <h3 className="text-slate-900 mb-2">Monthly Plan</h3>
              <p className="text-slate-500 mb-8">Perfect for short-term learning</p>
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900">$50</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Full access to all seminars",
                  "Downloadable resources",
                  "Monthly Q&A sessions"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribeClick('monthly')}
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-4 rounded-xl transition-colors min-h-[56px]"
              >
                Subscribe
              </button>
            </div>

            {/* Yearly Plan */}
            <div className="bg-[#064e3b] rounded-3xl shadow-xl p-10 relative flex flex-col">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-amber-400 text-slate-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Best Value
                </span>
              </div>
              <h3 className="text-white mb-2">Yearly Plan</h3>
              <p className="text-emerald-100 mb-8">Save $100 with annual billing</p>
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">$500</span>
                <span className="text-emerald-200 font-medium">/year</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "Everything in Monthly",
                  "1-on-1 consultation (1/year)",
                  "Priority email support",
                  "Exclusive community access"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-emerald-50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribeClick('yearly')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 min-h-[56px]"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Attend */}
      <section className="py-24 bg-[#064e3b] text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-white mb-6">Why Attend Our Seminars?</h2>
              <p className="text-emerald-100 text-lg mb-12 leading-relaxed">
                Our training programs are meticulously designed to provide you with the knowledge and tools necessary for optimal health and disease prevention.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { title: "Expert-Led Training", desc: "Learn directly from experienced healthcare professionals and specialists." },
                  { title: "Practical Strategies", desc: "Gain actionable health strategies you can implement in your daily life immediately." },
                  { title: "Personalized Guidance", desc: "Receive tailored advice and answers to your specific health questions." },
                  { title: "Long-Term Improvement", desc: "Build sustainable habits for lasting health and disease prevention." }
                ].map((feature, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <h3 className="font-bold text-lg">{feature.title}</h3>
                    </div>
                    <p className="text-emerald-100/80 text-sm leading-relaxed pl-9">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Seminar environment" 
                className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-8 -left-8 bg-white text-slate-900 p-6 rounded-2xl shadow-xl flex items-center gap-5">
                <div className="bg-purple-100 p-4 rounded-full text-purple-600">
                  <Star className="fill-current w-8 h-8"/>
                </div>
                <div>
                  <div className="font-black text-2xl">4.9/5</div>
                  <div className="text-sm text-slate-500 font-medium">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-slate-900 mb-4">Participant Success Stories</h2>
            <p className="text-slate-600 text-lg">Hear how our training programs have transformed lives.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "This seminar completely changed my approach to managing my condition. The practical tips were invaluable.",
                name: "David Wilson",
                role: "Managing Diabetes Effectively"
              },
              {
                quote: "I finally understand how to build a sustainable, healthy diet. The instructor was incredibly knowledgeable.",
                name: "Maria Garcia",
                role: "Nutrition for Optimal Health"
              },
              {
                quote: "The mindfulness techniques I learned here have significantly reduced my daily anxiety. Highly recommended!",
                name: "James Thompson",
                role: "Stress Management"
              }
            ].map((story, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col">
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-slate-600 italic mb-8 flex-grow leading-relaxed">"{story.quote}"</p>
                <div>
                  <h4 className="font-bold text-slate-900">{story.name}</h4>
                  <p className="text-sm text-emerald-600 font-medium mt-1">{story.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-lg">Everything you need to know about our seminars.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-900 focus:outline-none min-h-[44px]"
                >
                  {faq.q}
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
        </div>
      )}

      {/* Subscription Modals */}
      <AnimatePresence>
        {showSubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      {selectedPlan === 'monthly' ? 'Monthly Plan ($50)' : 'Yearly Plan ($500)'}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                      Please enter your details to subscribe
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowSubModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="text" 
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="tel" 
                        placeholder="Phone Number (+237...)"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="email" 
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="text" 
                        placeholder="Your Location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 ml-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'MTN MoMo'})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.paymentMethod === 'MTN MoMo' 
                          ? 'border-amber-400 bg-amber-50 text-amber-700' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.paymentMethod === 'MTN MoMo' ? 'bg-amber-400 text-white' : 'bg-slate-200'}`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">MTN MoMo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'Orange Money'})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.paymentMethod === 'Orange Money' 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.paymentMethod === 'Orange Money' ? 'bg-orange-500 text-white' : 'bg-slate-200'}`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Orange Money</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>Submit Subscription</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmationModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Awaiting Activation</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                  Your request has been submitted successfully.<br /><br />
                  Please wait for activation.
                </p>

                <button 
                  onClick={() => setShowConfirmationModal(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showKeyModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Key className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Enter Activation Key</h2>
                <p className="text-slate-500 font-medium mb-8">
                  Please enter your key to access the LIVE seminar.
                </p>

                <div className="space-y-6">
                  <div className="relative">
                    <input 
                      id="activationKey"
                      type="text" 
                      placeholder="Enter your key"
                      value={subKey}
                      onChange={(e) => {
                        setSubKey(e.target.value);
                        setKeyError('');
                      }}
                      className={`w-full bg-slate-50 border ${keyError ? 'border-rose-500' : 'border-slate-200'} rounded-2xl py-5 px-6 text-center text-xl font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all uppercase`}
                    />
                    {keyError && (
                      <p className="text-rose-500 text-sm font-bold mt-2">{keyError}</p>
                    )}
                  </div>

                  <button 
                    onClick={handleKeyActivation}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    Validate
                  </button>
                  
                  <button 
                    onClick={() => setShowKeyModal(false)}
                    className="text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
