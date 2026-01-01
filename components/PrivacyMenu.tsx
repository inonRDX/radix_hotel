/**
 * Privacy Menu Component
 * Dropdown menu for privacy-related actions
 */

import React, { useEffect, useRef, useState } from 'react';
import { Shield, FileText, BarChart3 } from 'lucide-react';
import { safeRadixCommand, RadixCommands } from '../utils/radix';

interface PrivacyMenuProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
}

const PrivacyMenu: React.FC<PrivacyMenuProps> = ({ isOpen, onClose, triggerRef }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [placement, setPlacement] = useState<'top' | 'bottom'>('top');

    const menuItems = [
        {
            icon: FileText,
            label: 'Terms of Service',
            command: RadixCommands.TOS
        },
        {
            icon: BarChart3,
            label: 'Usage & Diagnostics',
            command: RadixCommands.USAGE_DIAGNOSTICS
        }
    ];

    useEffect(() => {
        if (!isOpen || !triggerRef.current || !menuRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current || !menuRef.current) return;

            const scaleRaw = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale');
            const scale = Number.parseFloat(scaleRaw) || 1;
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const margin = 12;

            const triggerTop = triggerRect.top / scale;
            const triggerLeft = triggerRect.left / scale;
            const triggerHeight = triggerRect.height / scale;
            const triggerWidth = triggerRect.width / scale;
            const menuHeight = menuRect.height / scale;
            const menuWidth = menuRect.width / scale;
            const viewportWidth = window.innerWidth / scale;

            // Prefer above; fall back below if not enough space
            let top = triggerTop - menuHeight - margin;
            let newPlacement: 'top' | 'bottom' = 'top';

            if (top < margin) {
                top = triggerTop + triggerHeight + margin;
                newPlacement = 'bottom';
            }

            let left = triggerLeft;
            left = Math.min(Math.max(margin, left), viewportWidth - menuWidth - margin);

            setPosition({ top, left });
            setPlacement(newPlacement);
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, { passive: true });

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, triggerRef]);

    const handleItemClick = (command: string) => {
        safeRadixCommand(command);
        onClose();
        triggerRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        const items = menuRef.current?.querySelectorAll('button');
        if (!items) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = items[(index + 1) % items.length] as HTMLButtonElement;
            next?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = items[(index - 1 + items.length) % items.length] as HTMLButtonElement;
            prev?.focus();
        } else if (e.key === 'Home') {
            e.preventDefault();
            (items[0] as HTMLButtonElement)?.focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            (items[items.length - 1] as HTMLButtonElement)?.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            role="menu"
            className="fixed z-[1000] min-w-[240px] bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            data-placement={placement}
        >
            {menuItems.map((item, index) => (
                <button
                    key={item.command}
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-200 hover:bg-amber-500/20 hover:text-amber-500 transition-all focus:outline-none focus:bg-amber-500/20 focus:text-amber-500"
                    onClick={() => handleItemClick(item.command)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    tabIndex={0}
                >
                    <item.icon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default PrivacyMenu;
