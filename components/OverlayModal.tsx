
import React from 'react';
import { X, ChevronRight, Star } from 'lucide-react';
import { ModalContent } from '../types';

interface OverlayModalProps {
  content: ModalContent;
  onClose: () => void;
}

const OverlayModal: React.FC<OverlayModalProps> = ({ content, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-16 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-12 right-12 p-3 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="w-full max-w-6xl h-full flex flex-col md:flex-row bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
        {/* Side Image / Graphic */}
        <div className="hidden md:block w-1/3 relative">
          <img
            src={content.image || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800"}
            className="w-full h-full object-cover"
            alt={content.title}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900" />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-16 overflow-y-auto">
          <div className="mb-12">
            <h4 className="text-amber-500 text-xs tracking-[0.4em] uppercase font-bold mb-4">
              {content.subtitle || 'Radix Premium'}
            </h4>
            <h2 className="serif text-6xl text-white font-bold leading-tight">
              {content.title}
            </h2>
          </div>

          <div className="space-y-8">
            {content.body}
          </div>

          <div className="mt-16 flex space-x-4">
            <button className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all transform hover:scale-105">
              Confirm Selection
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 border border-white/10 hover:bg-white/5 text-slate-300 rounded-lg transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayModal;
