
import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  isFocused: boolean;
  onFocus: () => void;
  onClick: () => void;
}

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ service, isFocused, onFocus, onClick }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative group cursor-pointer flex-shrink-0 transition-all duration-500 ease-out snap-center
          ${isFocused ? 'w-[340px] z-20' : 'w-[250px] z-10 opacity-60'}
        `}
        onMouseEnter={onFocus}
        onPointerEnter={onFocus}
        onClick={onClick}
      >
      <div className={`relative w-full h-[clamp(320px,54vh,460px)] rounded-2xl overflow-hidden transition-all duration-500 ease-out
        ${isFocused
          ? 'scale-110 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-4 ring-amber-500 ring-offset-[6px] ring-offset-slate-900'
          : 'scale-95 shadow-lg shadow-black/20'}
      `}>
        {/* Background Image */}
        <img
          src={service.image}
          alt={service.title}
          className={`w-full h-full object-cover transition-transform duration-1000 ease-out
            ${isFocused ? 'scale-110' : 'scale-100'}
          `}
          loading="lazy"
        />

        {/* Overlays */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500
          ${isFocused ? 'opacity-100' : 'opacity-80'}
          ${isFocused ? 'bg-black/40' : ''}
        `} />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className={`w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-amber-500 transition-all duration-500
            ${isFocused ? 'scale-110 bg-amber-500/20 text-white' : 'scale-100'}
          `}>
            {service.icon}
          </div>
          <div className="space-y-1">
            <h3 className={`serif font-bold text-white tracking-wide transition-all duration-500
              ${isFocused ? 'text-2xl' : 'text-lg'}
            `}>
              {service.title}
            </h3>
            <p className={`text-slate-300 text-xs transition-all duration-500 leading-relaxed overflow-hidden
              ${isFocused ? 'opacity-100 max-h-24 translate-y-0' : 'opacity-0 max-h-0 translate-y-4'}
            `}>
              {service.description}
            </p>
          </div>
        </div>
      </div>
      </div>
    );
  }
);

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;
