
import React from 'react';
import { Star, Hotel, ArrowRight } from 'lucide-react';
import { GuestInfo } from '../types';

interface SplashScreenProps {
  guest: GuestInfo;
  onDismiss: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ guest, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col items-center justify-center text-center px-6 overflow-hidden animate-in fade-in duration-1000">
      {/* Background Ambience */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-40 scale-105"
          alt=""
        />
        {/* Adjusted gradient to be slightly less heavy */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900" />
      </div>

      <div className="relative z-10 space-y-8 max-w-4xl">
        <div className="flex justify-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-6 h-6 fill-amber-500 text-amber-500 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="text-amber-500 text-xs tracking-[0.5em] uppercase font-bold opacity-90">
            Welcome to your Sanctuary
          </h2>
          <h1 className="serif text-7xl md:text-8xl text-white font-bold tracking-tight drop-shadow-2xl">
            {guest.name}
          </h1>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <div className="h-[1px] w-12 bg-amber-500/40" />
          <div className="flex items-center space-x-2 text-slate-100">
            <Hotel className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-light">Suite {guest.room}</span>
          </div>
          <div className="h-[1px] w-12 bg-amber-500/40" />
        </div>

        <p className="text-slate-200 text-xl font-light max-w-2xl mx-auto italic leading-relaxed">
          "Excellence is not an act, but a habit. We are delighted to serve you again."
        </p>

        <button 
          onClick={onDismiss}
          className="group relative px-12 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-full transition-all duration-500 overflow-hidden shadow-2xl shadow-amber-900/20"
        >
          <span className="relative z-10 flex items-center space-x-3 text-lg font-bold tracking-widest uppercase">
            <span>Enter Suite</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>

      <div className="absolute bottom-12 text-slate-400 text-[10px] tracking-[0.3em] uppercase font-medium">
        Press any key to continue
      </div>
    </div>
  );
};

export default SplashScreen;
