"use client";

import "./globals.css";
import Link from "next/link";
import { Logo } from "../components/Logo";
import { ToastProvider } from "../components/Toast";
import { ThemeToggle } from "../components/ThemeToggle";
import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/authStore";

function NavbarSearch({ isMobile, closeMenu }: { isMobile?: boolean; closeMenu?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (closeMenu) closeMenu();
    }
  };

  return (
    <form onSubmit={handleSearch} className={isMobile ? "mobile-search" : "navbar-search"}>
      <button type="submit" style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }} aria-label="Search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-3)' }} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </button>
      <input
        type="text"
        placeholder="Compare prices..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={isMobile ? "mobile-search-input" : "navbar-search-input"}
      />
    </form>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* No-FOUC theme init: applies the persisted / system theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bhao-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
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
              <Suspense fallback={
                <div className="navbar-search">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-3)' }} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input type="text" placeholder="Compare prices..." className="navbar-search-input" disabled />
                </div>
              }>
                <NavbarSearch />
              </Suspense>

              {/* Right: Auth */}
              <div className="navbar-right">
                <ThemeToggle />
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
                <Suspense fallback={
                  <div className="mobile-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-3)' }} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input type="text" placeholder="Compare prices..." className="mobile-search-input" disabled />
                  </div>
                }>
                  <NavbarSearch isMobile={true} closeMenu={() => setMobileMenuOpen(false)} />
                </Suspense>
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
