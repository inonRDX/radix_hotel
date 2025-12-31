
import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, Star } from 'lucide-react';
import { ModalContent } from '../types';

interface OverlayModalProps {
  content: ModalContent;
  onClose: () => void;
}

const OverlayModal: React.FC<OverlayModalProps> = ({ content, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const focusablesRef = useRef<HTMLButtonElement[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    const node = modalRef.current;
    if (!node) return;
    const focusables = Array.from(node.querySelectorAll('button'));
    focusablesRef.current = focusables;
    if (focusables[0]) {
      focusables[0].focus();
      setFocusIndex(0);
    }
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Escape', 'Backspace', 'BrowserBack', 'GoBack'].includes(e.key)) {
        e.preventDefault();
        onClose();
        return;
      }
      const focusables = focusablesRef.current;
      if (!focusables.length) return;

      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const nextIndex = (focusIndex + 1) % focusables.length;
        setFocusIndex(nextIndex);
        focusables[nextIndex].focus();
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const nextIndex = (focusIndex - 1 + focusables.length) % focusables.length;
        setFocusIndex(nextIndex);
        focusables[nextIndex].focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        focusables[focusIndex].click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusIndex, onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-16 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-6xl h-full flex flex-col md:flex-row bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
        <button
          onClick={onClose}
          className="focus-ring absolute top-6 right-6 p-3 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>
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
            <button className="focus-ring px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all transform hover:scale-105">
              Confirm Selection
            </button>
            <button
              onClick={onClose}
              className="focus-ring px-8 py-4 border border-white/10 hover:bg-white/5 text-slate-300 rounded-lg transition-all"
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
