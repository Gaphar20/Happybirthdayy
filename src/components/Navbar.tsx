import React, { useState } from 'react';
import { Menu, X, User as UserIcon, HeartHandshake } from 'lucide-react';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminAuthenticated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdmin,
  isAdminAuthenticated,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const navLinks = [
    { name: 'Home', href: '#hero', id: 'hero' },
    { name: 'About Dad', href: '#about', id: 'about' },
    { name: 'Memories', href: '#memories', id: 'memories' },
    { name: 'Wishes', href: '#wishes', id: 'wishes' },
    { name: 'Send a Gift', href: '#gift', id: 'gift' },
    { name: 'Family Note', href: '#tribute', id: 'tribute' },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    e.preventDefault();
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/85 backdrop-blur-xl border-b border-[#c5a059]/15 shadow-[0_1px_8px_rgba(43,38,35,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between gap-4">
        {/* Monogram Brand */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero', 'hero')}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center border border-[#c5a059]/40 shadow-[0_0_15px_rgba(197,160,89,0.2)] group-hover:border-[#775a19] transition-colors">
            <span className="font-serif text-lg text-[#775a19] font-bold">IA</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base text-[#1c1c19] font-semibold leading-tight tracking-tight">
              Idris Abdulrazaq
            </span>
            <span className="text-[11px] font-semibold text-[#775a19] uppercase tracking-widest">
              Oluwatoyin • Sept 19
            </span>
          </div>
        </a>

        {/* Desktop Nav Pills */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#f6f3ee]/90 p-1.5 rounded-full border border-[#d1c5b4]/30 shadow-inner">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.id)}
                className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#c5a059] text-[#261900] font-semibold shadow-sm'
                    : 'text-[#4e4639] hover:text-[#1c1c19] hover:bg-[#f0ede9]'
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <a
            href="#wishes"
            onClick={(e) => handleNavClick(e, '#wishes', 'wishes')}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#31302d] text-[#f3f0eb] hover:bg-[#775a19] hover:text-white transition-all shadow-[0_4px_16px_rgba(43,38,35,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-xs font-semibold uppercase tracking-wider"
          >
            <span>Leave a Wish</span>
            <span>💌</span>
          </a>

          {/* Admin / User Icon */}
          <button
            type="button"
            onClick={onOpenAdmin}
            title={isAdminAuthenticated ? 'Admin Moderation Active' : 'Admin Login'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
              isAdminAuthenticated
                ? 'bg-[#775a19] text-white ring-2 ring-[#c5a059]'
                : 'bg-[#f0ede9] text-[#775a19] hover:bg-[#c5a059] hover:text-white border border-[#c5a059]/30'
            }`}
          >
            {isAdminAuthenticated ? (
              <HeartHandshake className="w-4 h-4" />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-[#4e4639] hover:text-[#1c1c19] hover:bg-[#ebe8e3] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#ffffff]/98 backdrop-blur-2xl border-b border-[#c5a059]/20 shadow-xl px-5 py-6">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.id)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  activeSection === link.id
                    ? 'bg-[#f6f3ee] text-[#775a19] font-semibold'
                    : 'text-[#1c1c19] hover:bg-[#f6f3ee]'
                }`}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 border-t border-[#f0ede9] flex flex-col gap-2">
              <a
                href="#wishes"
                onClick={(e) => handleNavClick(e, '#wishes', 'wishes')}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#775a19] text-white font-semibold text-sm shadow-md"
              >
                <span>Leave a Wish</span>
                <span>💌</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
