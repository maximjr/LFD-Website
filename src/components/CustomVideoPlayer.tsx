import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, Pause, Maximize, Minimize, Volume2, VolumeX, 
  PictureInPicture, RotateCcw, RotateCw, Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomVideoPlayerProps {
  url: string;
  title?: string;
  isLive?: boolean;
}

const Player = ReactPlayer as any;

export default function CustomVideoPlayer({ url, title, isLive = false }: CustomVideoPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [pip, setPip] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showSeekFeedback, setShowSeekFeedback] = useState<'forward' | 'rewind' | null>(null);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  }, [playing]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Attempt to lock orientation to landscape
        const screenOrientation = window.screen.orientation as any;
        if (screenOrientation && screenOrientation.lock) {
          try {
            await screenOrientation.lock('landscape');
          } catch (e) {
            console.warn('Orientation lock failed:', e);
          }
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        const screenOrientation = window.screen.orientation as any;
        if (screenOrientation && screenOrientation.unlock) {
          screenOrientation.unlock();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Gestures
  const handleContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const x = clientX - rect.left;
      
      if (x < rect.width / 2) {
        // Rewind
        handleSeekRelative(-10);
        setShowSeekFeedback('rewind');
      } else {
        // Forward
        handleSeekRelative(10);
        setShowSeekFeedback('forward');
      }
      
      setTimeout(() => setShowSeekFeedback(null), 500);
      setLastTap(0); // Reset to prevent triple tap
    } else {
      setLastTap(now);
      setShowControls(prev => !prev);
      if (!showControls) resetControlsTimeout();
    }
  };

  const handleSeekRelative = (seconds: number) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + seconds, 'seconds');
    }
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: any) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const togglePip = () => {
    setPip(!pip);
  };

  // Swipe down to exit fullscreen logic
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isFullscreen) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    
    if (deltaY > 100) { // Swipe down threshold
      toggleFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black group overflow-hidden ${isFullscreen ? 'w-screen h-screen' : 'w-full aspect-video rounded-3xl border border-slate-700 shadow-2xl'}`}
      onMouseMove={resetControlsTimeout}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 z-0">
        <Player
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          pip={pip}
          onProgress={handleProgress as any}
          onDuration={setDuration}
          onBuffer={() => setBuffering(true)}
          onBufferEnd={() => setBuffering(false)}
          onEnablePIP={() => setPip(true)}
          onDisablePIP={() => setPip(false)}
          config={{
            youtube: {
              playerVars: { 
                modestbranding: 1, 
                controls: 0, 
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                disablekb: 1
              }
            }
          } as any}
          className="absolute inset-0"
        />
        {/* Gesture Capture Layer */}
        <div 
          className="absolute inset-0 z-10 cursor-pointer" 
          onClick={handleContainerClick}
        />
      </div>

      {/* Buffering Indicator */}
      <AnimatePresence>
        {buffering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seek Feedback Overlay */}
      <AnimatePresence>
        {showSeekFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-1/2 ${showSeekFeedback === 'rewind' ? 'left-1/4' : 'right-1/4'} -translate-y-1/2 z-20 pointer-events-none bg-black/40 backdrop-blur-sm p-6 rounded-full`}
          >
            {showSeekFeedback === 'rewind' ? (
              <div className="flex flex-col items-center">
                <RotateCcw className="w-10 h-10 text-white mb-2" />
                <span className="text-white font-bold text-sm">10s</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <RotateCw className="w-10 h-10 text-white mb-2" />
                <span className="text-white font-bold text-sm">10s</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-6 bg-gradient-to-t from-black/80 via-transparent to-black/40"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLive && (
                  <div className="flex items-center gap-2 bg-rose-600 px-3 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">Live</span>
                  </div>
                )}
                <h3 className="text-white font-bold truncate max-w-[200px] md:max-w-md drop-shadow-lg">
                  {title || 'Live Seminar'}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={togglePip}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title="Picture in Picture"
                >
                  <PictureInPicture className="w-5 h-5" />
                </button>
                {isFullscreen && (
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="Exit Fullscreen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Center Play Button */}
            <div className="flex-grow flex items-center justify-center pointer-events-none">
              <AnimatePresence>
                {(!playing || !showControls) && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: showControls ? 1 : 0, scale: showControls ? 1 : 0.8 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setPlaying(!playing); }}
                    className="p-6 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full text-white pointer-events-auto shadow-2xl"
                  >
                    {playing ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-1" />}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Bar */}
            <div className="space-y-4">
              {/* Progress Bar */}
              {!isLive && (
                <div className="relative group/progress h-1.5 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={0.999999}
                    step="any"
                    value={played}
                    onMouseDown={handleSeekMouseDown}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekMouseUp}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${played * 100}%` }}
                    />
                  </div>
                  <div 
                    className="absolute h-4 w-4 bg-emerald-500 rounded-full shadow-lg border-2 border-white scale-0 group-hover/progress:scale-100 transition-transform pointer-events-none"
                    style={{ left: `calc(${played * 100}% - 8px)` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setPlaying(!playing)}
                    className="text-white hover:text-emerald-400 transition-colors"
                  >
                    {playing ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                  </button>

                  <div className="flex items-center gap-2 group/volume">
                    <button 
                      onClick={() => setMuted(!muted)}
                      className="text-white hover:text-emerald-400 transition-colors"
                    >
                      {muted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step="any"
                      value={muted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {!isLive && (
                    <span className="text-xs font-mono text-white/80">
                      {formatTime(played * duration)} / {formatTime(duration)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleFullscreen}
                    className="text-white hover:text-emerald-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(seconds: number) {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = pad(date.getUTCSeconds());
  if (hh) {
    return `${hh}:${pad(mm)}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function pad(string: number) {
  return ('0' + string).slice(-2);
}
