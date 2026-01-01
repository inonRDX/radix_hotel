
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
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-b from-black/80 to-transparent opacity-0 animate-[slideDown_3s_ease-out_1s_forwards]"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="h-full flex items-center justify-between px-16 translate-y-[20%]">
        <div className="flex items-center space-x-6">
        <div className="w-[5rem] h-[5rem] bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/40">
          <span className="serif text-[2.6rem] font-bold text-white leading-none">R</span>
        </div>
        <div className="flex flex-col">
          <h1 className="serif text-[clamp(2.3rem,3.2vw,3.4rem)] tracking-widest text-amber-500 font-bold">Radix GRAND</h1>
          <div className="flex items-center text-[clamp(0.75rem,1.1vw,1.1rem)] tracking-[0.3em] text-slate-400 uppercase">
            <MapPin className="w-4 h-4 mr-2" />
            {weather?.city || 'San Francisco'}
          </div>
        </div>
      </div>

        <div className="flex items-center space-x-12 text-slate-200">
        {weather && (
          <div className="flex items-center space-x-4 bg-white/5 px-7 py-3 rounded-full border border-white/10 backdrop-blur-sm">
            <Sun className="w-7 h-7 text-amber-500" />
            <span className="text-[clamp(1.6rem,2.2vw,2.2rem)] font-light">{weather.temp}°C</span>
            <span className="text-[clamp(0.75rem,1.1vw,1.1rem)] text-slate-400 uppercase tracking-wider hidden lg:inline">{weather.condition}</span>
          </div>
        )}

        <div className="flex flex-col items-end border-l border-white/10 pl-12">
          <span className="text-[clamp(2.5rem,3.6vw,3.6rem)] font-light tracking-widest tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className="text-[clamp(0.75rem,1.1vw,1.1rem)] tracking-[0.3em] text-amber-500 uppercase font-bold">Room {guest.room}</span>
        </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
