import { motion } from 'motion/react';
import { Video, Users, MessageSquare, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export default function LiveSeminars() {
  const { currentUser, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUserAccess() {
      if (!currentUser) {
        setHasAccess(false);
        return;
      }

      try {
        const q = query(
          collection(db, "subscriptions"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const subData = querySnapshot.docs[0].data();
          const now = Timestamp.now();
          const expiry = subData.expiryDate as Timestamp;

          if (expiry && now.toMillis() < expiry.toMillis()) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      }
    }

    checkUserAccess();
  }, [currentUser]);

  if (loading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser || !hasAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 py-6">
        <div className="container-custom flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Live Training Session</h1>
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Now • 124 watching
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-5 h-5" />
              <span className="font-medium">124 Participants</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold text-sm">Verified Access</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-8">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID" 
                title="Live Seminar Stream"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>

            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4">About this Seminar</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                Welcome to your exclusive seminar access. In this session, our lead specialist discusses advanced strategies for managing chronic conditions through nutrition, lifestyle changes, and modern medical interventions.
              </p>
            </div>
          </div>

          {/* Chat Sidebar Placeholder */}
          <div className="flex flex-col h-[600px] lg:h-auto bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                Live Chat
              </h3>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Only Verified</span>
            </div>
            
            <div className="flex-grow p-6 space-y-6 overflow-y-auto">
              {[
                { user: "Sarah J.", msg: "This is so helpful, thank you doctor!" },
                { user: "Michael C.", msg: "What about the diet plan for hypertension?" },
                { user: "Emily D.", msg: "The presentation is very clear." },
                { user: "Admin", msg: "Welcome everyone! Feel free to ask questions.", isAdmin: true }
              ].map((chat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${chat.isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {chat.user}
                  </span>
                  <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    {chat.msg}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-slate-700">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-all">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
