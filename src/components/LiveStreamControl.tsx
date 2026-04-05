import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Video, Settings, Save, Youtube } from 'lucide-react';

export default function LiveStreamControl() {
  const [config, setConfig] = useState<any>({
    streamTitle: 'Optimal Healthcare Live Seminar',
    streamDescription: 'Join our lead specialist for an exclusive live training session.',
    youtubeVideoId: '',
    streamStatus: 'offline',
    isSeminarActive: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');

  useEffect(() => {
    const docRef = doc(db, 'streamConfig', 'default');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        if (data.youtubeVideoId) {
          setYoutubeLink(`https://www.youtube.com/watch?v=${data.youtubeVideoId}`);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeLink(url);
    const videoId = extractYouTubeId(url);
    if (videoId) {
      setConfig({ ...config, youtubeVideoId: videoId });
    } else if (url === '') {
      setConfig({ ...config, youtubeVideoId: '' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'streamConfig', 'default'), {
        ...config,
        updatedAt: serverTimestamp(),
        createdAt: config.createdAt || serverTimestamp()
      }, { merge: true });
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-emerald-600" />
            Live Seminar Control
          </h2>
          <p className="text-slate-500 mt-1">Manage your YouTube Live broadcast settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Config'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings className="w-5 h-5 text-slate-400" />
              Seminar Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Stream Title</label>
                <input
                  type="text"
                  value={config.streamTitle || ''}
                  onChange={(e) => setConfig({...config, streamTitle: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Stream Description</label>
                <textarea
                  value={config.streamDescription || ''}
                  onChange={(e) => setConfig({...config, streamDescription: e.target.value})}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  YouTube Live Stream URL
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeLink}
                  onChange={handleYoutubeLinkChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                {config.youtubeVideoId && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    Extracted Video ID: {config.youtubeVideoId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Stream Status</label>
                  <select
                    value={config.streamStatus}
                    onChange={(e) => setConfig({...config, streamStatus: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="offline">Offline</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seminar Access</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={config.isSeminarActive}
                        onChange={(e) => setConfig({...config, isSeminarActive: e.target.checked})}
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${config.isSeminarActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.isSeminarActive ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <span className="font-medium text-slate-700">
                      {config.isSeminarActive ? 'Seminar Enabled' : 'Seminar Disabled'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 text-sm">How it works</h4>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Create an <strong>Unlisted</strong> live stream in YouTube Studio.</li>
              <li>Paste the YouTube link above. The system will automatically extract the Video ID.</li>
              <li>Toggle <strong>Seminar Access</strong> to Enabled and set Status to <strong>Live</strong> when you are ready to broadcast.</li>
              <li>Only authenticated users with active subscriptions will be able to view the embedded player.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-rose-500" />
              Stream Preview
            </h3>
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-4 border border-slate-800">
              {config.youtubeVideoId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${config.youtubeVideoId}?autoplay=0&mute=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Youtube className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No YouTube Link Provided</p>
                </div>
              )}
            </div>
            <div className="text-sm text-slate-500 text-center bg-slate-50 p-3 rounded-lg border border-slate-100">
              This is a preview of the YouTube stream. Users will only see this player when the status is set to <strong>Live</strong> and Seminar Access is <strong>Enabled</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
