import { Video, ShieldCheck, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import CustomVideoPlayer from '../components/CustomVideoPlayer';

export default function LiveSeminars() {
  const { currentUser, loading, isAdmin } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [streamConfig, setStreamConfig] = useState<any>(null);

  useEffect(() => {
    async function checkUserAccess() {
      if (!currentUser) {
        setHasAccess(false);
        return;
      }

      if (isAdmin) {
        setHasAccess(true);
        return;
      }

      try {
        const q = query(
          collection(db, "subscriptions"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "active")
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          let hasValidActive = false;
          const now = Timestamp.now();

          for (const doc of querySnapshot.docs) {
            const subData = doc.data();
            if (subData.deleted === true) continue; // Skip deleted subscriptions
            
            const expiry = subData.expiryDate as Timestamp;
            if (expiry && now.toMillis() < expiry.toMillis()) {
              hasValidActive = true;
              break;
            }
          }
          setHasAccess(hasValidActive);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      }
    }

    checkUserAccess();
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (hasAccess) {
      const docRef = doc(db, 'streamConfig', 'default');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setStreamConfig(docSnap.data());
        }
      });
      return () => unsubscribe();
    }
  }, [hasAccess]);

  if (loading || (currentUser && hasAccess === null) || (hasAccess && !streamConfig)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading stream configuration...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-slate-400">
            Active subscription required to access the live seminar.
          </p>
        </div>
      </div>
    );
  }

  const isLive = streamConfig.isSeminarActive && streamConfig.streamStatus === 'live';

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
              <h1 className="text-xl font-bold">{streamConfig.streamTitle || 'Live Seminar'}</h1>
              <p className={`text-sm flex items-center gap-2 ${isLive ? 'text-rose-400' : 'text-slate-400'}`}>
                {isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
                {isLive ? 'LIVE' : streamConfig.streamStatus === 'ended' ? 'Ended' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold text-sm">Verified Access</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-8">
        <div className="container-custom max-w-5xl mx-auto space-y-8">
          {/* Video Player Container */}
          <div className="relative">
            {isLive && streamConfig.youtubeVideoId ? (
              <CustomVideoPlayer 
                url={`https://www.youtube.com/watch?v=${streamConfig.youtubeVideoId}`}
                title={streamConfig.streamTitle}
                isLive={true}
              />
            ) : isLive && !streamConfig.youtubeVideoId ? (
              <div className="aspect-video bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-slate-700 shadow-2xl">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-xl">
                    <AlertCircle className="w-10 h-10 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">
                    Video Feed Connecting...
                  </h2>
                  <p className="text-slate-400 max-w-md">
                    The seminar is live, but the video feed is currently being connected by the administrator. Please hold on.
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-slate-700 shadow-2xl">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-xl">
                    <Video className="w-10 h-10 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">
                    {streamConfig.streamStatus === 'ended' 
                      ? 'This seminar has ended.' 
                      : 'Live seminar will begin shortly.'}
                  </h2>
                  <p className="text-slate-400 max-w-md">
                    {streamConfig.streamStatus === 'ended'
                      ? 'Thank you for attending. Check back later for the next scheduled live training session.'
                      : 'Please wait, the presenter is getting ready. The stream will appear here automatically when it begins.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Seminar Details */}
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-white">About this Seminar</h2>
            <p className="text-slate-400 leading-relaxed text-lg whitespace-pre-wrap">
              {streamConfig.streamDescription || 'No description provided.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

