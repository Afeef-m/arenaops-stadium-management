'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';

const navLinks = [
  { label: 'Events', href: '/events' },
  { label: 'Venues', href: '/stadiums' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Bookings', href: '/bookings' },
];

const quickLinks = [
  { label: 'Host Events', href: '/register-event-manager' },
  { label: 'Create Event', href: '/events/create' },
  { label: 'Sign In', href: '/login' },
  { label: 'Register', href: '/register' },
];

const SimpleUniqueFooter = () => {
  const footerRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveGlow = (e: MouseEvent) => {
      if (!footerRef.current || !glowRef.current) return;
      const rect = footerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(glowRef.current, {
        x,
        y,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', moveGlow);
    return () => window.removeEventListener('mousemove', moveGlow);
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative bg-black py-16 px-8 overflow-hidden border-t border-white/5"
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute top-0 left-0 w-100 h-100 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/20 blur-[100px] rounded-full z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Top Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl font-black italic tracking-tighter text-white">
                Arena<span className="text-emerald-500">Ops</span>
              </span>
            </Link>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 max-w-xs">
              The ultimate platform for stadium event management,
              <br /> ticketing & audience engagement.
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="flex flex-wrap gap-12 lg:gap-16">
            {/* Explore */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
                Explore
              </h4>
              <nav className="flex flex-col gap-2.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group relative text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors w-fit"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 transition-all group-hover:w-full" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
                Get Started
              </h4>
              <nav className="flex flex-col gap-2.5">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group relative text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors w-fit"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 transition-all group-hover:w-full" />
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Ready to host?
            </p>
            <Link
              href="/event-manager"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
            >
              Become an Event Manager ↗
            </Link>
            <Link
              href="/events"
              className="px-6 py-2.5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white hover:text-black transition-all duration-300"
            >
              Browse Events ↗
            </Link>
            <Link
              href="/manager/stadiumLayout"
              className="px-6 py-2.5 border border-emerald-400 rounded-full text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/20 transition-all duration-300"
            >
              Layout Editor
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-gray-700 uppercase tracking-[0.3em]">
            © 2026 ArenaOps Stadium Management Platform
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-gray-700 uppercase tracking-[0.2em]">Privacy</span>
            <span className="text-[10px] text-gray-700 uppercase tracking-[0.2em]">Terms</span>
            <span className="text-[10px] text-gray-700 uppercase tracking-[0.2em]">Support</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
    </footer>
  );
};

export default SimpleUniqueFooter;
