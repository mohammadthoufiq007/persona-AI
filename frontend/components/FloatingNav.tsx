'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Sparkles, Database, LayoutDashboard, Disc3 } from 'lucide-react';

export type Tab = {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const tabs: Tab[] = [
  { id: 'canvas', label: 'Canvas', href: '/', icon: Disc3 },
  { id: 'kb', label: 'Knowledge Base', href: '/knowledge', icon: Database },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'assistants', label: 'Assistants', href: '/assistants', icon: Sparkles },
];

interface FloatingNavProps {
  onOpenKb?: () => void;
  onOpenAgents?: () => void;
  isKbOpen?: boolean;
  isAgentsOpen?: boolean;
  isEmbedded?: boolean;
  className?: string;
}

export function FloatingNav({ onOpenKb, isKbOpen, isEmbedded, className }: FloatingNavProps) {
  const pathname = usePathname();

  return (
    <div 
      role="navigation"
      aria-label="Global Floating Navigation"
      className={clsx(
        isEmbedded ? "relative select-none" : "fixed top-6 left-1/2 -translate-x-1/2 z-50 select-none",
        className
      )}
    >
      <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
        {tabs.map((tab) => {
          const isRouteActive = tab.href.startsWith('/') && pathname === tab.href && !isKbOpen;
          const isKbActive = tab.id === 'kb' && isKbOpen;
          const isActive = isRouteActive || isKbActive;
          const Icon = tab.icon;

          const content = (
            <>
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-white/15 border border-white/20 rounded-full shadow-inner"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {Icon && <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-white" : "text-white/60")} />}
                <span>{tab.label}</span>
              </span>
            </>
          );

          if (tab.id === 'kb' && onOpenKb) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onOpenKb?.()}
                className={clsx(
                  "relative px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors outline-none rounded-full cursor-pointer",
                  isActive ? "text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={clsx(
                "relative px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors outline-none rounded-full cursor-pointer",
                isActive ? "text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
