/**
 * Toast Notification System
 * Displays elegant toast notifications
 */

import React, { useState, useEffect } from 'react';

export interface ToastData {
    id: string;
    title: string;
    body: string;
    icon?: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastData;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setShow(true));

        // Auto-dismiss after duration
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(() => onDismiss(toast.id), 400);
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    return (
        <div
            className={`min-w-[400px] max-w-[500px] bg-gradient-to-br from-slate-800/95 to-slate-900/98 border-2 border-amber-500 rounded-2xl shadow-2xl shadow-amber-500/20 p-6 backdrop-blur-xl transition-all duration-400 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
            style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
        >
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40">
                    <i className={`fa-solid ${toast.icon || 'fa-bell'} text-2xl text-slate-900`}></i>
                </div>
                <div className="font-bold text-xl mb-2 text-amber-500 uppercase tracking-wider">
                    {toast.title}
                </div>
                <div className="text-slate-300 text-base leading-relaxed">
                    {toast.body}
                </div>
            </div>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-[5000] pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
};

// Toast manager hook
export function useToasts() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = (title: string, body: string, icon?: string, duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts([{ id, title, body, icon, duration }]);
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, showToast, dismissToast };
}
