"use client";

import "./globals.css";
import Link from "next/link";
import { Logo } from "../components/Logo";
import { ToastProvider } from "../components/Toast";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/authStore";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, checkSession, logout } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navItems = [
    { href: "/search", label: "Browse" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/alerts", label: "Alerts" },
  ];

  return (
    <html lang="en">
      <head>
        <title>BHAO.PK | Intelligent Price Discovery</title>
        <meta name="description" content="Track prices. Compare deals. Save money." />
      </head>
      <body>
        <ToastProvider>
          <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
            <div className="navbar-inner">
              {/* Left: Logo + Nav */}
              <div className="navbar-left">
                <Link href="/" className="nav-logo">
                  <Logo size="sm" showText={true} />
                </Link>
                <div className="nav-divider" />
                <div className="nav-links-desktop">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link ${pathname === item.href || (item.href !== "/search" && pathname.startsWith(item.href)) ? "nav-link-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Center: Search */}
              <form onSubmit={handleSearch} className="navbar-search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Compare prices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="navbar-search-input"
                />
              </form>

              {/* Right: Auth */}
              <div className="navbar-right">
                {isAuthenticated ? (
                  <>
                    <Link href="/profile" className="nav-profile-btn">
                      <div className="nav-avatar">
                        {(user?.name || user?.email || "U")[0].toUpperCase()}
                      </div>
                      <span className="nav-profile-name">{user?.name || user?.email?.split("@")[0]}</span>
                    </Link>
                    <button onClick={async () => { await logout(); router.push("/"); }} className="nav-logout-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="nav-auth-guest">
                    <Link href="/login" className="nav-login-btn">Log in</Link>
                    <Link href="/signup" className="btn btn-primary nav-signup-btn">Sign up</Link>
                  </div>
                )}

                {/* Mobile Menu Toggle */}
                <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="mobile-menu">
                <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="mobile-search">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Compare prices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mobile-search-input"
                  />
                </form>
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-nav-link ${pathname === item.href ? "mobile-nav-link-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mobile-auth">
                  {isAuthenticated ? (
                    <>
                      <Link href="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                        Profile ({user?.name || user?.email?.split("@")[0]})
                      </Link>
                      <button onClick={async () => { await logout(); setMobileMenuOpen(false); router.push("/"); }} className="mobile-nav-link mobile-nav-logout">
                        Log out
                      </button>
                    </>
                  ) : (
                    <div className="mobile-auth-buttons">
                      <Link href="/login" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Log in</Link>
                      <Link href="/signup" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>Sign up</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </nav>

          <main>{children}</main>

          <footer>
            <div className="footer-content">
              <div className="footer-col">
                <Link href="/" style={{ textDecoration: "none", marginBottom: "12px", display: "inline-block" }}>
                  <Logo size="md" showText={true} />
                </Link>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6" }}>Intelligent price comparison engine for the savvy shopper. Data, no fluff.</p>
              </div>
              <div className="footer-col">
                <h4>Platform</h4>
                <ul>
                  <li><Link href="/search">Browse Products</Link></li>
                  <li><Link href="/wishlist">Wishlist</Link></li>
                  <li><Link href="/alerts">Price Alerts</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <ul>
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/privacy">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              &copy; {new Date().getFullYear()} BHAO.PK &mdash; Data. No Fluff.
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
