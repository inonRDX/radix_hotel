
import React, { useState, useEffect } from 'react';
import { MapPin, Sun } from 'lucide-react';
import { WeatherData, GuestInfo } from '../types';

interface HeaderProps {
  weather: WeatherData | null;
  guest: GuestInfo;
}

const Header: React.FC<HeaderProps> = ({ weather, guest }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-16 z-[100] bg-gradient-to-b from-black/80 to-transparent opacity-0 animate-[slideDown_3s_ease-out_1s_forwards]"
      style={{ height: 'var(--header-height)' }}>
      <div className="flex items-center space-x-6">
        <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/40">
          <span className="serif text-4xl font-bold text-white leading-none">R</span>
        </div>
        <div className="flex flex-col">
          <h1 className="serif text-[clamp(1.75rem,2.4vw,2.6rem)] tracking-widest text-amber-500 font-bold">Radix GRAND</h1>
          <div className="flex items-center text-[clamp(0.65rem,0.95vw,0.9rem)] tracking-[0.25em] text-slate-400 uppercase">
            <MapPin className="w-3 h-3 mr-1.5" />
            {weather?.city || 'San Francisco'}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-12 text-slate-200">
        {weather && (
          <div className="flex items-center space-x-3 bg-white/5 px-5 py-2 rounded-full border border-white/10 backdrop-blur-sm">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-[clamp(1.2rem,1.7vw,1.6rem)] font-light">{weather.temp}°C</span>
            <span className="text-[clamp(0.65rem,0.95vw,0.9rem)] text-slate-400 uppercase tracking-wider hidden lg:inline">{weather.condition}</span>
          </div>
        )}

        <div className="flex flex-col items-end border-l border-white/10 pl-12">
          <span className="text-[clamp(2rem,2.8vw,2.8rem)] font-light tracking-widest tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className="text-[clamp(0.65rem,0.95vw,0.9rem)] tracking-[0.25em] text-amber-500 uppercase font-bold">Room {guest.room}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
