import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Custom cursor to hide system cursor
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (dot && ring) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      const handleMouseMove = (e: MouseEvent) => { 
        mx = e.clientX; my = e.clientY; 
      };
      const animateCursor = () => {
        if (dot && ring) {
          dot.style.left = mx + 'px'; 
          dot.style.top = my + 'px';
          rx += (mx - rx) * 0.12; 
          ry += (my - ry) * 0.12;
          ring.style.left = rx + 'px'; 
          ring.style.top = ry + 'px';
        }
        requestAnimationFrame(animateCursor);
      };
      document.addEventListener('mousemove', handleMouseMove);
      animateCursor();
      
      // Hide system cursor
      document.body.style.cursor = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        // Restore system cursor
        document.body.style.cursor = 'auto';
      };
    }
  }, []);

  useEffect(() => {
    // Mobile menu
    const ham = document.getElementById('ham');
    const mobileMenu = document.getElementById('mobile-menu');
    if (ham && mobileMenu) {
      ham.addEventListener('click', () => {
        ham.classList.toggle('open');
        mobileMenu.classList.toggle('open');
      });
      const closeMobileMenu = () => {
        ham.classList.remove('open');
        mobileMenu.classList.remove('open');
      };
      // Close menu when clicking links
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    // Sticky nav
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('stuck', window.scrollY > 40);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));

    // Counter animation
    const counters = document.querySelectorAll<HTMLElement>('[data-target]');
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const target = parseInt(el.dataset.target || '0');
          const suffix = el.dataset.suffix || '';
          let start: number | null = null;
          const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / 1400, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(ease * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          cio.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));

    // Role tabs
    const rtabs = document.querySelectorAll<HTMLButtonElement>('.rtab');
    rtabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        rtabs.forEach((b) => b.classList.remove('on'));
        document.querySelectorAll('.flow-panel').forEach((p) => p.classList.remove('show'));
        btn.classList.add('on');
        const panel = document.getElementById(btn.dataset.flow || '');
        if (panel) panel.classList.add('show');
      });
    });

    // Feature tabs
    const ftabs = document.querySelectorAll<HTMLButtonElement>('.ftab');
    ftabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        ftabs.forEach((b) => b.classList.remove('on'));
        document.querySelectorAll('.feat-grid').forEach((g) => g.classList.remove('show'));
        btn.classList.add('on');
        const panel = document.getElementById(btn.dataset.panel || '');
        if (panel) {
          panel.classList.add('show');
          panel.querySelectorAll<HTMLElement>('.fcard').forEach((c, i) => {
            c.style.opacity = '0';
            c.style.transform = 'translateY(18px)';
            setTimeout(() => {
              c.style.transition = 'opacity .4s ease, transform .4s ease';
              c.style.opacity = '1';
              c.style.transform = 'none';
            }, i * 55);
          });
        }
      });
    });

    // Preview tabs
    const ptabs = document.querySelectorAll<HTMLButtonElement>('.preview-tab');
    ptabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        ptabs.forEach((b) => b.classList.remove('on'));
        document.querySelectorAll('.preview-panel').forEach((p) => p.classList.remove('show'));
        btn.classList.add('on');
        const panel = document.getElementById(btn.dataset.preview || '');
        if (panel) {
          panel.classList.add('show');
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      io.disconnect();
      cio.disconnect();
    };
  }, []);

  const goToLogin = () => navigate('/auth');

  const closeMobileMenu = () => {
    const ham = document.getElementById('ham');
    const mobileMenu = document.getElementById('mobile-menu');
    if (ham && mobileMenu) {
      ham.classList.remove('open');
      mobileMenu.classList.remove('open');
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const navHeight = navRef.current?.offsetHeight || 80;
      const targetPosition = targetElement.offsetTop - navHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
    closeMobileMenu();
  };

  return (
    <>
      {/* Custom cursor */}
      <div id="cur-dot" ref={cursorDotRef}></div>
      <div id="cur-ring" ref={cursorRingRef}></div>
      
      {/* NAV */}
      <nav id="nav" ref={navRef}>
        <a className="nav-logo" href="#">FOOD<span className="accent">BRIDGE</span></a>
        <div className="nav-links">
          <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')}>About</a>
          <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')}>Features</a>
          <a href="#how" onClick={(e) => handleSmoothScroll(e, 'how')}>How It Works</a>
          <a href="#platforms" onClick={(e) => handleSmoothScroll(e, 'platforms')}>Apps</a>
          <a href="#tech" onClick={(e) => handleSmoothScroll(e, 'tech')}>Technology</a>
          <a href="#roadmap" onClick={(e) => handleSmoothScroll(e, 'roadmap')}>Roadmap</a>
          <a className="nav-cta" onClick={goToLogin}>Sign In →</a>
        </div>
        <button className="ham" id="ham">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div id="mobile-menu">
        <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')}>About</a>
        <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')}>Features</a>
        <a href="#how" onClick={(e) => handleSmoothScroll(e, 'how')}>How It Works</a>
        <a href="#platforms" onClick={(e) => handleSmoothScroll(e, 'platforms')}>Apps</a>
        <a href="#tech" onClick={(e) => handleSmoothScroll(e, 'tech')}>Technology</a>
        <a href="#roadmap" onClick={(e) => handleSmoothScroll(e, 'roadmap')}>Roadmap</a>
        <a className="mobile-cta" onClick={goToLogin}>Sign In →</a>
      </div>

      {/* HERO */}
      <section id="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid-lines"></div>
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Platform v1.0 · Now in Development
            </div>
            <h1 className="hero-title">
              THE FUTURE OF<br />
              <span className="italic-line">food delivery</span><br />
              STARTS HERE
            </h1>
            <p className="hero-desc">
              FoodBridge is a complete multi-vendor food delivery and restaurant management ecosystem — connecting customers, restaurants, delivery agents, and platform administrators in one unified, real-time experience.
            </p>
            <div className="hero-actions">
              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="btn btn-primary btn-lg">Explore Features →</a>
              <a className="btn btn-amber btn-lg" onClick={goToLogin}>🚀 Sign In to Dashboard</a>
            </div>
            <div className="hero-metrics">
              <div className="hm-item">
                <div className="hm-num">4<span className="accent">+</span></div>
                <div className="hm-label">Client Apps</div>
              </div>
              <div className="hm-item">
                <div className="hm-num">8<span className="accent">+</span></div>
                <div className="hm-label">User Roles</div>
              </div>
              <div className="hm-item">
                <div className="hm-num">13<span className="accent">+</span></div>
                <div className="hm-label">Modules</div>
              </div>
              <div className="hm-item">
                <div className="hm-num">99.5<span className="accent">%</span></div>
                <div className="hm-label">Uptime Target</div>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="hero-phone-wrap">
            <div className="phone-glow"></div>
            <div className="phone-shell">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="app-status-bar">
                  <span className="time">11:35</span>
                  <div className="app-status-icons">▲ 📶 🔋</div>
                </div>
                <div className="app-topbar">
                  <div className="app-topbar-left">
                    <div className="greeting-line">Hey Sarthak 👋, hungry?</div>
                    <div className="greeting-name">198/155, Indore</div>
                  </div>
                  <div className="app-topbar-right">
                    <div className="app-icon-btn">🔔</div>
                    <div className="app-icon-btn">🛒</div>
                  </div>
                </div>
                <div className="app-location-bar">
                  <span className="loc-pin">📍</span>
                  <span className="loc-text">DELIVERING TO</span>
                  <span className="loc-arrow">▾</span>
                </div>
                <div className="app-search">
                  <span className="s-icon">🔍</span>
                  <span className="s-text">Search restaurants & dishes...</span>
                  <div className="s-mic">🎙</div>
                </div>
                <div className="app-filter-row">
                  <span className="app-filter active">🔥 Popular</span>
                  <span className="app-filter">⚡ Fast Delivery</span>
                  <span className="app-filter">🥗 Pure Veg</span>
                </div>
                <div className="app-promo">
                  <div>
                    <div className="app-promo-badge">● LIMITED TIME</div>
                    <div className="app-promo-title">50% OFF</div>
                    <div className="app-promo-sub">On your first order</div>
                  </div>
                  <div className="app-promo-btn">Order Now ›</div>
                </div>
                <div className="app-section-header">
                  <span className="app-section-title">What's on your mind?</span>
                  <span className="app-section-see">See All</span>
                </div>
                <div className="app-cat-row">
                  <div className="app-cat-item">
                    <div className="app-cat-icon biryani">🍚</div>
                    <span className="app-cat-label">Biryani</span>
                  </div>
                  <div className="app-cat-item">
                    <div className="app-cat-icon pizza">🍕</div>
                    <span className="app-cat-label">Pizza</span>
                  </div>
                  <div className="app-cat-item">
                    <div className="app-cat-icon burger">🍔</div>
                    <span className="app-cat-label">Burger</span>
                  </div>
                  <div className="app-cat-item">
                    <div className="app-cat-icon chinese">🥡</div>
                    <span className="app-cat-label">Chinese</span>
                  </div>
                </div>
                <div className="app-section-header">
                  <span className="app-section-title">Popular Dishes 🔥</span>
                  <span className="app-section-see">See All</span>
                </div>
                <div className="app-dishes-row">
                  <div className="app-dish-card">
                    <div className="app-dish-img">
                      🍛
                      <div className="veg-dot"></div>
                    </div>
                    <div className="app-dish-info">
                      <div className="app-dish-name">Margherita</div>
                      <div className="app-dish-price">₹249</div>
                    </div>
                    <div className="app-add-btn">ADD +</div>
                  </div>
                  <div className="app-dish-card">
                    <div className="app-dish-img">
                      🍕
                      <div className="veg-dot"></div>
                    </div>
                    <div className="app-dish-info">
                      <div className="app-dish-name">Farmhouse</div>
                      <div className="app-dish-price">₹311</div>
                    </div>
                    <div className="app-add-btn">ADD +</div>
                  </div>
                </div>
                <div className="app-bottom-nav">
                  <div className="app-nav-item on">
                    <span className="app-nav-icon">🏠</span>Home
                  </div>
                  <div className="app-nav-item">
                    <span className="app-nav-icon">🛒</span>Cart
                  </div>
                  <div className="app-nav-item">
                    <span className="app-nav-icon">📦</span>Orders
                  </div>
                  <div className="app-nav-item">
                    <span className="app-nav-icon">👤</span>Profile
                  </div>
                </div>
              </div>
            </div>

            {/* Second phone */}
            <div className="phone-shell-orders">
              <div className="phone-screen-orders">
                <div className="os-topbar">
                  <span className="os-title">Your Orders</span>
                  <span className="os-search-icon">🔍</span>
                </div>
                <div className="os-tabs">
                  <span className="os-tab on">All Orders</span>
                  <span className="os-tab">Active</span>
                  <span className="os-tab">Past</span>
                </div>
                <div className="os-filter-row">
                  <span className="os-filter">📅 Today</span>
                  <span className="os-filter">📅 This Week</span>
                </div>
                <div className="os-active-card">
                  <div className="os-active-label">Order in Progress</div>
                  <div className="os-active-rest">Burger Barn</div>
                  <div className="os-active-bottom">
                    <div className="os-status-pill">🏪 Placed</div>
                    <span className="os-track-link">Track ›</span>
                  </div>
                </div>
                <div className="os-all-label">All Orders (1)</div>
                <div className="os-order-card">
                  <div className="os-order-header">
                    <div className="os-rest-icon">🍽️</div>
                    <div>
                      <div className="os-rest-name">Spice Garden</div>
                      <div className="os-order-date">25-Mar-2026, 6:10 pm</div>
                    </div>
                    <div className="os-delivered-badge">✅ Delivered</div>
                  </div>
                  <div className="os-order-items">Items not available</div>
                  <div className="os-order-footer">
                    <div>
                      <span className="os-amount">₹267</span>
                      <span className="os-items-count"> · 0 items</span>
                    </div>
                    <div className="os-order-btns">
                      <span className="os-reorder-btn">↺ Reorder</span>
                      <span className="os-details-btn">Details ›</span>
                    </div>
                  </div>
                </div>
                <div className="os-bottom-nav">
                  <div className="os-nav-item">
                    <span className="os-nav-icon">🏠</span>Home
                  </div>
                  <div className="os-nav-item">
                    <span className="os-nav-icon">🛒</span>Cart
                  </div>
                  <div className="os-nav-item on">
                    <span className="os-nav-icon">📦</span>Orders
                  </div>
                  <div className="os-nav-item">
                    <span className="os-nav-icon">👤</span>Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-bar">
        <div className="ticker-track">
          <div className="ticker-item">Customer App <span className="ticker-dot"></span></div>
          <div className="ticker-item">Vendor Panel <span className="ticker-dot"></span></div>
          <div className="ticker-item">Delivery Agent App <span className="ticker-dot"></span></div>
          <div className="ticker-item">Admin Dashboard <span className="ticker-dot"></span></div>
          <div className="ticker-item">Real-Time Orders <span className="ticker-dot"></span></div>
          <div className="ticker-item">Razorpay Payments <span className="ticker-dot"></span></div>
          <div className="ticker-item">Role-Based Access Control <span className="ticker-dot"></span></div>
          <div className="ticker-item">Socket.IO Events <span className="ticker-dot"></span></div>
          <div className="ticker-item">FCM Push Notifications <span className="ticker-dot"></span></div>
          <div className="ticker-item">Cloud Native Architecture <span className="ticker-dot"></span></div>
          <div className="ticker-item">Customer App <span className="ticker-dot"></span></div>
          <div className="ticker-item">Vendor Panel <span className="ticker-dot"></span></div>
          <div className="ticker-item">Delivery Agent App <span className="ticker-dot"></span></div>
          <div className="ticker-item">Admin Dashboard <span className="ticker-dot"></span></div>
          <div className="ticker-item">Real-Time Orders <span className="ticker-dot"></span></div>
          <div className="ticker-item">Razorpay Payments <span className="ticker-dot"></span></div>
          <div className="ticker-item">Role-Based Access Control <span className="ticker-dot"></span></div>
          <div className="ticker-item">Socket.IO Events <span className="ticker-dot"></span></div>
          <div className="ticker-item">FCM Push Notifications <span className="ticker-dot"></span></div>
          <div className="ticker-item">Cloud Native Architecture <span className="ticker-dot"></span></div>
        </div>
      </div>

      {/* TRUST */}
      <section id="trust">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item reveal">
              <div className="trust-icon">📱</div>
              <div className="trust-item-content">
                <div className="tnum" data-target="4">0<span className="t-accent">+</span></div>
                <div className="tlabel">Client Applications</div>
              </div>
            </div>
            <div className="trust-item reveal delay-1">
              <div className="trust-icon">🧩</div>
              <div className="trust-item-content">
                <div className="tnum" data-target="13">0</div>
                <div className="tlabel">Domain Service Modules</div>
              </div>
            </div>
            <div className="trust-item reveal delay-2">
              <div className="trust-icon">👥</div>
              <div className="trust-item-content">
                <div className="tnum" data-target="8">0</div>
                <div className="tlabel">Distinct User Roles</div>
              </div>
            </div>
            <div className="trust-item reveal delay-3">
              <div className="trust-icon">⚡</div>
              <div className="trust-item-content">
                <div className="tnum">500<span className="t-accent">ms</span></div>
                <div className="tlabel">API Response Target (p95)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-visual reveal">
              <div className="about-cards-stack">
                <div className="about-card">
                  <div className="about-card-icon">📱</div>
                  <div className="about-card-num">4<sup>+</sup></div>
                  <div className="about-card-label">Distinct Client Apps</div>
                  <div className="about-card-desc">iOS, Android, and Web — all sharing one Node.js API backend.</div>
                </div>
                <div className="about-card span-2">
                  <div className="about-card-icon">🧩</div>
                  <div className="about-card-num">13</div>
                  <div className="about-card-label">Service Modules</div>
                  <div className="about-card-desc">Auth, Orders, Payments, Delivery, Notifications, and 8 more.</div>
                </div>
                <div className="about-card">
                  <div className="about-card-icon">👥</div>
                  <div className="about-card-num">8</div>
                  <div className="about-card-label">User Roles</div>
                  <div className="about-card-desc">Customer, Vendor, Manager, Waiter, Kitchen, Cashier, Agent, Super Admin.</div>
                </div>
                <div className="about-card">
                  <div className="about-card-icon">⚡</div>
                  <div className="about-card-num">500ms</div>
                  <div className="about-card-label">API Response Target (p95)</div>
                  <div className="about-card-desc">Enforced by Redis caching and indexed PostgreSQL queries.</div>
                </div>
              </div>
            </div>
            <div className="about-text reveal delay-2">
              <div className="section-title">
                <div className="eyebrow">What is FoodBridge</div>
                <h2 className="display-heading">
                  ONE PLATFORM.<br />
                  <span className="serif-accent">Every role.</span><br />
                  EVERY ORDER.
                </h2>
              </div>
              <div className="about-blockquote">
                <p>"FoodBridge is not just a delivery app — it's a complete restaurant management and food delivery ecosystem designed to serve every actor in the chain simultaneously."</p>
              </div>
              <p className="body-text">
                Built on a modular monolith architecture with a single Node.js REST API, FoodBridge powers food delivery, dine-in ordering, takeaway management, kitchen coordination, and full platform analytics — all from one unified backend.
              </p>
              <div className="about-pills">
                <span className="pill">React Native · iOS & Android</span>
                <span className="pill">Unified REST API</span>
                <span className="pill">Socket.IO Real-Time</span>
                <span className="pill">Razorpay Payments</span>
                <span className="pill">JWT + OTP Auth</span>
                <span className="pill">Docker · AWS · CI/CD</span>
                <span className="pill">PostgreSQL + Redis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="container">
          <div className="how-header reveal">
            <div className="eyebrow">How It Works</div>
            <h2 className="display-heading">
              EVERY ROLE,<br />
              <span className="serif-accent">a perfect</span> EXPERIENCE
            </h2>
            <p className="body-text">FoodBridge orchestrates every actor in the food delivery chain through real-time, event-driven workflows.</p>
          </div>
          <div className="role-tabs reveal delay-1">
            <button className="rtab on" data-flow="f-customer">👤 Customer</button>
            <button className="rtab" data-flow="f-vendor">🍽️ Restaurant</button>
            <button className="rtab" data-flow="f-agent">🛵 Delivery Agent</button>
            <button className="rtab" data-flow="f-admin">🖥️ Admin</button>
          </div>
          <div id="f-customer" className="flow-panel show">
            <div className="flow-steps">
              <div className="fstep reveal">
                <div className="fstep-num hi">🔍</div>
                <h4>Browse & Discover</h4>
                <p>Search restaurants by cuisine, view full menus with variants and modifiers, read verified reviews.</p>
              </div>
              <div className="fstep reveal delay-1">
                <div className="fstep-num">🛒</div>
                <h4>Build Your Cart</h4>
                <p>Add items with custom variants, choose a delivery address via Google Maps, and apply a coupon code.</p>
              </div>
              <div className="fstep reveal delay-2">
                <div className="fstep-num">💳</div>
                <h4>Pay Securely</h4>
                <p>Complete payment via UPI, card, or wallet using embedded Razorpay SDK. HMAC-verified webhooks.</p>
              </div>
              <div className="fstep reveal delay-3">
                <div className="fstep-num hi">🎉</div>
                <h4>Track & Enjoy</h4>
                <p>Get live push notifications at every step — accepted, preparing, on the way, and delivered.</p>
              </div>
            </div>
          </div>
          <div id="f-vendor" className="flow-panel">
            <div className="flow-steps">
              <div className="fstep reveal">
                <div className="fstep-num hi">🏪</div>
                <h4>Onboard & Go Live</h4>
                <p>Submit your restaurant profile for admin review. Once approved, configure menus, tables, hours.</p>
              </div>
              <div className="fstep reveal delay-1">
                <div className="fstep-num">📋</div>
                <h4>Receive Orders Live</h4>
                <p>New orders appear instantly on your real-time board via Socket.IO — no polling required.</p>
              </div>
              <div className="fstep reveal delay-2">
                <div className="fstep-num">👨‍🍳</div>
                <h4>Coordinate Kitchen</h4>
                <p>Kitchen staff tracks every order on the live kitchen display. Assign a delivery agent once packed.</p>
              </div>
              <div className="fstep reveal delay-3">
                <div className="fstep-num hi">📊</div>
                <h4>Grow with Data</h4>
                <p>Review sales reports, monitor commission deductions, respond to reviews, and export CSV data.</p>
              </div>
            </div>
          </div>
          <div id="f-agent" className="flow-panel">
            <div className="flow-steps">
              <div className="fstep reveal">
                <div className="fstep-num hi">🟢</div>
                <h4>Go Online</h4>
                <p>Toggle your availability in the agent app. Your status syncs to Redis and the backend in real time.</p>
              </div>
              <div className="fstep reveal delay-1">
                <div className="fstep-num">📲</div>
                <h4>Receive Task Push</h4>
                <p>A high-priority FCM/APNs notification wakes the app instantly with full pickup details.</p>
              </div>
              <div className="fstep reveal delay-2">
                <div className="fstep-num">🗺️</div>
                <h4>Navigate to Pickup</h4>
                <p>Deep-link directly into Google Maps or Apple Maps for turn-by-turn directions to the restaurant.</p>
              </div>
              <div className="fstep reveal delay-3">
                <div className="fstep-num hi">✅</div>
                <h4>Deliver & Complete</h4>
                <p>Mark the order as Delivered. The customer is notified instantly, commission is auto-calculated.</p>
              </div>
            </div>
          </div>
          <div id="f-admin" className="flow-panel">
            <div className="flow-steps">
              <div className="fstep reveal">
                <div className="fstep-num hi">🏛️</div>
                <h4>Platform Oversight</h4>
                <p>Super Admin has full access to all restaurants, users, orders, and reports.</p>
              </div>
              <div className="fstep reveal delay-1">
                <div className="fstep-num">⚙️</div>
                <h4>Configure Platform</h4>
                <p>Set per-restaurant commission rates, manage platform feature flags, configure banners.</p>
              </div>
              <div className="fstep reveal delay-2">
                <div className="fstep-num">🎫</div>
                <h4>Resolve Support</h4>
                <p>Full access to all support tickets. Thread messages with customers, flag refunds, escalate issues.</p>
              </div>
              <div className="fstep reveal delay-3">
                <div className="fstep-num hi">📉</div>
                <h4>Analyse & Export</h4>
                <p>View platform-wide sales, vendor payout, and order analytics via Recharts dashboards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="container">
          <div className="feat-top reveal">
            <div>
              <div className="eyebrow">Core Features</div>
              <h2 className="display-heading">
                BUILT FOR EVERY<br />
                <span className="serif-accent">part of</span> THE CHAIN
              </h2>
            </div>
            <div className="feat-tabs">
              <button className="ftab on" data-panel="p-ordering">🛒 Ordering</button>
              <button className="ftab" data-panel="p-vendor">🍽️ Vendor</button>
              <button className="ftab" data-panel="p-ops">⚙️ Operations</button>
            </div>
          </div>
          <div id="p-ordering" className="feat-grid show">
            <div className="fcard reveal">
              <div className="fcard-icon">🛒</div>
              <h3>Multi-Type Ordering</h3>
              <p>Online delivery, dine-in table orders, and takeaway — all flowing through the same unified order lifecycle.</p>
              <span className="fcard-tag">→ Delivery · Dine-In · Takeaway</span>
            </div>
            <div className="fcard reveal delay-1">
              <div className="fcard-icon">💳</div>
              <h3>Razorpay Payments</h3>
              <p>UPI, cards, wallets, and net banking via Razorpay SDK. HMAC webhook verification, idempotency keys.</p>
              <span className="fcard-tag">→ Secure · Idempotent · Verified</span>
            </div>
            <div className="fcard reveal delay-2">
              <div className="fcard-icon">🎟️</div>
              <h3>Smart Coupon Engine</h3>
              <p>Vendor-specific and platform-wide coupon codes with applicability validation and per-user usage limits.</p>
              <span className="fcard-tag">→ Smart · Trackable · Flexible</span>
            </div>
            <div className="fcard reveal">
              <div className="fcard-icon">⭐</div>
              <h3>Reviews & Ratings</h3>
              <p>Post-delivery customer reviews with vendor reply capability, admin-level moderation, and auto aggregation.</p>
              <span className="fcard-tag">→ Transparent · Moderated</span>
            </div>
            <div className="fcard reveal delay-1">
              <div className="fcard-icon">📍</div>
              <h3>Address & Maps</h3>
              <p>Google Maps SDK-powered address selection, multi-address storage per customer, and agent GPS polling.</p>
              <span className="fcard-tag">→ Accurate · Multi-Address</span>
            </div>
            <div className="fcard reveal delay-2">
              <div className="fcard-icon">🆘</div>
              <h3>Support Tickets</h3>
              <p>Full support ticket lifecycle with threaded messaging, status management, and refund-flagging.</p>
              <span className="fcard-tag">→ Threaded · Escalatable</span>
            </div>
          </div>
          <div id="p-vendor" className="feat-grid">
            <div className="fcard reveal">
              <div className="fcard-icon">🍽️</div>
              <h3>Menu Management</h3>
              <p>Full category, item, variant, and modifier group management. Upload item photos to S3/CDN.</p>
              <span className="fcard-tag">→ Variants · Modifiers · Images</span>
            </div>
            <div className="fcard reveal delay-1">
              <div className="fcard-icon">📊</div>
              <h3>Real-Time Order Board</h3>
              <p>Live order board powered by Socket.IO — new orders appear the instant they're placed.</p>
              <span className="fcard-tag">→ Socket.IO · Zero-Latency</span>
            </div>
            <div className="fcard reveal delay-2">
              <div className="fcard-icon">👨‍🍳</div>
              <h3>Kitchen Display System</h3>
              <p>Dedicated kitchen view that streams live order status events via WebSocket.</p>
              <span className="fcard-tag">→ Tablet-Optimized · Live</span>
            </div>
            <div className="fcard reveal">
              <div className="fcard-icon">🪑</div>
              <h3>Table Management</h3>
              <p>Create tables, track occupancy, assign waiters, and manage full dine-in sessions.</p>
              <span className="fcard-tag">→ Dine-In · Auto-Release</span>
            </div>
            <div className="fcard reveal delay-1">
              <div className="fcard-icon">👥</div>
              <h3>Staff & Role Management</h3>
              <p>Add managers, waiters, kitchen staff, and cashiers with granular RBAC.</p>
              <span className="fcard-tag">→ RBAC · Granular Access</span>
            </div>
            <div className="fcard reveal delay-2">
              <div className="fcard-icon">📈</div>
              <h3>Sales Reports & Analytics</h3>
              <p>Pre-aggregated sales, order counts, and delivery performance reports. CSV export.</p>
              <span className="fcard-tag">→ Exportable · Auto-Calculated</span>
            </div>
          </div>
          <div id="p-ops" className="feat-grid">
            <div className="fcard reveal">
              <div className="fcard-icon">🔐</div>
              <h3>OTP Authentication</h3>
              <p>Passwordless OTP login via SMS. JWT access tokens (15–60 min) + 30-day refresh tokens.</p>
              <span className="fcard-tag">→ Passwordless · Stateless JWT</span>
            </div>
            <div className="fcard reveal delay-1">
              <div className="fcard-icon">🛵</div>
              <h3>Delivery Management</h3>
              <p>Vendor-controlled agent assignment, full task lifecycle, reassignment logic, and real-time push.</p>
              <span className="fcard-tag">→ Full Lifecycle · Real-Time</span>
            </div>
            <div className="fcard reveal delay-2">
              <div className="fcard-icon">🔔</div>
              <h3>Multi-Channel Notifications</h3>
              <p>FCM, APNs, SMS, and email dispatched asynchronously across 14 system events.</p>
              <span className="fcard-tag">→ Async · Resilient · 14 Events</span>
            </div>
            <div className="fcard reveal">
              <div className="fcard-icon">💰</div>
              <h3>Commission Engine</h3>
              <p>Commission auto-calculated on every completed order at the restaurant's configured rate.</p>
              <span className="fcard-tag">→ Auto-Calculated · Configurable</span>
            </div>
            <div className="fcard reveal delay-1">
              <div className="fcard-icon">🏪</div>
              <h3>Restaurant Approval Flow</h3>
              <p>Admin-controlled onboarding with approval/rejection workflow.</p>
              <span className="fcard-tag">→ Governed · Auditable</span>
            </div>
            <div className="fcard reveal delay-2">
              <div className="fcard-icon">🖥️</div>
              <h3>Super Admin Panel</h3>
              <p>Full platform oversight — all restaurants, users, orders, coupons, commissions from one dashboard.</p>
              <span className="fcard-tag">→ Full Oversight · Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section id="platforms">
        <div className="container">
          <div className="platforms-header reveal">
            <div className="eyebrow">The Applications</div>
            <h2 className="display-heading" style={{marginTop: '14px', fontSize: 'var(--display-lg)'}}>
              THREE APPS.<br /><span className="serif-accent" style={{color: 'var(--red)'}}>one backbone.</span>
            </h2>
            <p className="body-text" style={{marginTop: '14px', maxWidth: '520px'}}>
              All client apps talk to a single unified Node.js REST API — enforcing the same business rules, RBAC, and real-time event model regardless of interface.
            </p>
          </div>
          <div className="platforms-grid">
            <div className="pcard customer reveal">
              <div className="pcard-hero">
                <div className="pcard-badge">📱 React Native</div>
                <span className="pcard-emoji">👤</span>
                <h3>Customer App</h3>
                <p className="pcard-desc body-text">The primary consumer experience — a single React Native codebase for iOS and Android that makes ordering intuitive, fast, and reliable.</p>
              </div>
              <div className="pcard-features">
                <div className="pcard-feat"><span className="ck">✓</span>Restaurant discovery with cuisine filters & Google Maps address</div>
                <div className="pcard-feat"><span className="ck">✓</span>Menu browsing with full variant and modifier support</div>
                <div className="pcard-feat"><span className="ck">✓</span>Embedded Razorpay checkout — UPI, cards, wallets</div>
                <div className="pcard-feat"><span className="ck">✓</span>Live order status push notifications at every step</div>
                <div className="pcard-feat"><span className="ck">✓</span>Coupon redemption, order history, and post-delivery reviews</div>
                <div className="pcard-feat"><span className="ck">✓</span>Offline-resilient via React Query stale-while-revalidate</div>
              </div>
            </div>
            <div className="pcard agent reveal delay-1">
              <div className="pcard-hero">
                <div className="pcard-badge">📱 React Native</div>
                <span className="pcard-emoji">🛵</span>
                <h3>Delivery Agent App</h3>
                <p className="pcard-desc body-text">A lightweight, focused task-management app built for speed — keeping agents informed and moving without unnecessary complexity.</p>
              </div>
              <div className="pcard-features">
                <div className="pcard-feat"><span className="ck">✓</span>Online / offline availability toggle with real-time backend sync</div>
                <div className="pcard-feat"><span className="ck">✓</span>High-priority FCM/APNs task push that wakes the app</div>
                <div className="pcard-feat"><span className="ck">✓</span>Google Maps / Apple Maps deep-link navigation</div>
                <div className="pcard-feat"><span className="ck">✓</span>Full task lifecycle — Assigned → Picked Up → Delivered</div>
                <div className="pcard-feat"><span className="ck">✓</span>Optional background GPS reporting for customer tracking</div>
              </div>
            </div>
            <div className="pcard web reveal delay-2">
              <div className="pcard-hero">
                <div className="pcard-badge">🌐 React SPA · Vite</div>
                <span className="pcard-emoji">🖥️</span>
                <h3>Vendor & Admin Panel</h3>
                <p className="pcard-desc body-text">A single React SPA that renders the Restaurant or Admin Panel based on the JWT role claim — no duplicate codebase, no duplicate deployment.</p>
              </div>
              <div className="pcard-features">
                <div className="pcard-feat"><span className="ck">✓</span>Real-time order board and kitchen view via Socket.IO</div>
                <div className="pcard-feat"><span className="ck">✓</span>Menu, table, staff, agent, and coupon management</div>
                <div className="pcard-feat"><span className="ck">✓</span>Sales & commission analytics with Recharts dashboards</div>
                <div className="pcard-feat"><span className="ck">✓</span>Admin: full platform oversight, approvals, and settings</div>
                <div className="pcard-feat"><span className="ck">✓</span>Tablet-optimized views for waiters and kitchen staff</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APP PREVIEWS */}
      <section id="app-preview" style={{padding: 'clamp(80px, 10vw, 120px) 0', background: 'var(--ink)', overflow: 'hidden'}}>
        <div className="container">
          <div className="reveal" style={{marginBottom: '52px'}}>
            <div className="eyebrow">Live Platform Previews</div>
            <h2 className="display-heading" style={{marginTop: '14px'}}>
              SEE THE REAL<br /><span className="serif-accent" style={{color: 'var(--amber)'}}>dashboards</span> IN ACTION
            </h2>
            <p className="body-text" style={{marginTop: '14px', maxWidth: '560px'}}>
              These are the actual screens from the FoodBridge platform — the admin panel, vendor dashboard, and the customer mobile app — all built and live.
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{display: 'flex', gap: '8px', marginBottom: '36px', flexWrap: 'wrap'}} className="reveal delay-1">
            <button className="preview-tab on" data-preview="prev-admin">🖥️ Admin Dashboard</button>
            <button className="preview-tab" data-preview="prev-vendor">🍽️ Vendor Dashboard</button>
            <button className="preview-tab" data-preview="prev-mobile">📱 Customer App</button>
          </div>

          {/* Admin Dashboard Preview */}
          <div className="preview-panel show" id="prev-admin">
            <div style={{
              background: '#fff',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid rgba(242,236,224,.06)',
              boxShadow: '0 40px 100px rgba(0,0,0,.6)',
              fontFamily: 'var(--ff-body)',
              display: 'flex',
              maxHeight: '580px',
            }} className="reveal">

              {/* Sidebar */}
              <div style={{width: '200px', background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '20px 0'}}>
                {/* Brand */}
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)'}}>
                  <div style={{width: '28px', height: '28px', borderRadius: '6px', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'}}>🌉</div>
                  <div>
                    <div style={{color: '#fff', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '.02em'}}>FoodBridge</div>
                    <div style={{color: 'rgba(255,255,255,.4)', fontSize: '0.6rem', marginTop: '1px'}}>Admin Panel</div>
                  </div>
                </div>
                {/* Nav items */}
                <div style={{padding: '14px 0', flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: 'var(--red)', margin: '0 8px', borderRadius: '8px', cursor: 'default'}}>
                    <span style={{fontSize: '0.85rem'}}>📊</span>
                    <span style={{fontSize: '0.75rem', fontWeight: '700', color: '#fff'}}>Dashboard</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.85rem', opacity: 0.5}}>🏪</span>
                    <span style={{fontSize: '0.75rem', color: 'rgba(255,255,255,.45)'}}>Restaurants</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.85rem', opacity: 0.5}}>👥</span>
                    <span style={{fontSize: '0.75rem', color: 'rgba(255,255,255,.45)'}}>Users</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.85rem', opacity: 0.5}}>📈</span>
                    <span style={{fontSize: '0.75rem', color: 'rgba(255,255,255,.45)'}}>Reports</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.85rem', opacity: 0.5}}>🎫</span>
                    <span style={{fontSize: '0.75rem', color: 'rgba(255,255,255,.45)'}}>Support</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.85rem', opacity: 0.5}}>⚙️</span>
                    <span style={{fontSize: '0.75rem', color: 'rgba(255,255,255,.45)'}}>Settings</span>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div style={{flex: 1, background: '#f8f9fa', overflowY: 'auto', padding: '20px 24px'}}>
                {/* Top bar */}
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
                  <div>
                    <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#111'}}>Platform Dashboard</div>
                    <div style={{fontSize: '0.7rem', color: '#888', marginTop: '2px'}}>18 Apr — 25 Apr 2026</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <span style={{fontSize: '0.6rem', fontWeight: '700', color: '#111'}}>9111349957</span>
                      <span style={{width: '26px', height: '26px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: '700'}}>S</span>
                    </div>
                    <div style={{fontSize: '0.8rem'}}>🔔</div>
                    <div style={{fontSize: '0.72rem', fontWeight: '600', color: '#333'}}>Admin User</div>
                  </div>
                </div>

                {/* Stat cards row 1 */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px'}}>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.06em'}}>TOTAL REVENUE</div>
                      <div style={{fontSize: '1.4rem', fontWeight: '800', color: '#22c55e', marginTop: '4px'}}>₹18,910</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>Platform commission: ₹1,891</div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.06em'}}>TODAY'S REVENUE</div>
                      <div style={{fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6', marginTop: '4px'}}>₹0</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>This month: ₹18,910</div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{fontSize: '1.2rem'}}>🛍️</div>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>TOTAL ORDERS (7D)</div>
                      <div style={{fontSize: '1.3rem', fontWeight: '800', color: '#111', marginTop: '2px'}}>33</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>Today: 0</div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{fontSize: '1.2rem'}}>⭐</div>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>AVG. PLATFORM RATING</div>
                      <div style={{fontSize: '1.3rem', fontWeight: '800', color: '#111', marginTop: '2px'}}>0.0<span style={{fontSize: '0.75rem'}}>/5</span></div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>From 0 reviews</div>
                    </div>
                  </div>
                </div>

                {/* Chart placeholders */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px'}}>
                    <div style={{fontSize: '0.8rem', fontWeight: '700', color: '#111', marginBottom: '12px'}}>Revenue Trend (Last 7 Days)</div>
                    {/* Y-axis labels + bars */}
                    <div style={{display: 'flex', gap: '8px'}}>
                      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18px', gap: 0}}>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹1.2</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.9</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.6</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.3</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0</span>
                      </div>
                      <div style={{flex: 1, position: 'relative'}}>
                        {/* Grid lines */}
                        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18px', pointerEvents: 'none'}}>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                        </div>
                        {/* Chart line (flat = ₹0 data) */}
                        <div style={{height: '70px', display: 'flex', alignItems: 'flex-end', gap: 0, borderBottom: '2px solid #3b82f6', paddingBottom: 0, position: 'relative'}}>
                          <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#3b82f6', borderRadius: '2px'}}></div>
                          <div style={{position: 'absolute', bottom: '-3px', left: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6'}}></div>
                          <div style={{position: 'absolute', bottom: '-3px', right: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6'}}></div>
                        </div>
                        {/* X labels */}
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>19 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>20 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>21 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>22 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>23 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>24 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>25 Apr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px'}}>
                    <div style={{fontSize: '0.8rem', fontWeight: '700', color: '#111', marginBottom: '12px'}}>Orders Trend (Last 7 Days)</div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18px', gap: 0}}>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹1.2</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.9</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.6</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.3</span>
                        <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0</span>
                      </div>
                      <div style={{flex: 1, position: 'relative'}}>
                        {/* Grid lines */}
                        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18px', pointerEvents: 'none'}}>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                          <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                        </div>
                        {/* Chart line (flat = ₹0 data) */}
                        <div style={{height: '70px', display: 'flex', alignItems: 'flex-end', gap: 0, borderBottom: '2px solid #8b5cf6', paddingBottom: 0, position: 'relative'}}>
                          <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#8b5cf6', borderRadius: '2px'}}></div>
                          <div style={{position: 'absolute', bottom: '-3px', left: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6'}}></div>
                          <div style={{position: 'absolute', bottom: '-3px', right: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6'}}></div>
                        </div>
                        {/* X labels */}
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>19 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>20 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>21 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>22 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>23 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>24 Apr</span>
                          <span style={{fontSize: '0.45rem', color: '#aaa'}}>25 Apr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          {/* Vendor Dashboard Preview */}
          <div className="preview-panel" id="prev-vendor">
            <div style={{
              background: '#fff',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid rgba(242,236,224,.06)',
              boxShadow: '0 40px 100px rgba(0,0,0,.6)',
              fontFamily: 'var(--ff-body)',
              display: 'flex',
              maxHeight: '580px',
            }} className="reveal">

              {/* Sidebar */}
              <div style={{width: '200px', background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '20px 0'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)'}}>
                  <div style={{width: '28px', height: '28px', borderRadius: '6px', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'}}>🌉</div>
                  <div style={{color: '#fff', fontSize: '0.8rem', fontWeight: '700'}}>FoodBridge</div>
                </div>
                {/* Active restaurant */}
                <div style={{padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.06)'}}>
                  <div style={{fontSize: '0.52rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px'}}>ACTIVE RESTAURANT</div>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.06)', borderRadius: '6px', padding: '6px 8px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <div style={{width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0}}></div>
                      <span style={{fontSize: '0.6rem', color: '#fff', fontWeight: '600'}}>Rahul Foods</span>
                    </div>
                    <span style={{fontSize: '0.6rem', color: 'rgba(255,255,255,.4)'}}>⇄</span>
                  </div>
                  <div style={{marginTop: '8px', fontSize: '0.58rem', color: '#22c55e', cursor: 'default'}}>+ Add new restaurant</div>
                </div>
                {/* Nav */}
                <div style={{padding: '10px 0', flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--red)', margin: '0 8px', borderRadius: '7px'}}>
                    <span style={{fontSize: '0.8rem'}}>📊</span>
                    <span style={{fontSize: '0.72rem', fontWeight: '700', color: '#fff'}}>Dashboard</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', marginTop: '2px'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>📋</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Orders Board</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>🍽️</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Menu</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>🪑</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Tables</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>👥</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Staff</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>🛵</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Delivery Agents</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>🎟️</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Coupons</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>⭐</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Reviews</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'default', margin: '2px 0'}}>
                    <span style={{fontSize: '0.8rem', opacity: 0.5}}>📈</span>
                    <span style={{fontSize: '0.72rem', color: 'rgba(255,255,255,.45)'}}>Reports</span>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div style={{flex: 1, background: '#f8f9fa', overflowY: 'auto', padding: '20px 24px'}}>
                {/* Top bar */}
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px'}}>
                  <div>
                    <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#111'}}>Dashboard</div>
                    <div style={{fontSize: '0.7rem', color: '#888', marginTop: '2px'}}>18 Apr — 25 Apr 2026</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <span style={{fontSize: '0.6rem', fontWeight: '700', color: '#111'}}>Rahul Foods Restaurant</span>
                      <span style={{width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block'}}></span>
                      <span style={{fontSize: '0.6rem', color: '#22c55e', fontWeight: '700'}}>Active</span>
                    </div>
                    <div style={{fontSize: '0.8rem'}}>🔔</div>
                    <div style={{fontSize: '0.72rem', fontWeight: '600', color: '#333'}}>Rahul Verma</div>
                    {/* Toggle */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '5px 10px'}}>
                      <span style={{fontSize: '0.7rem', color: '#555'}}>⚡ Active</span>
                      <div style={{width: '28px', height: '16px', background: '#22c55e', borderRadius: '20px', position: 'relative', flexShrink: 0}}>
                        <div style={{width: '12px', height: '12px', background: '#fff', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI cards */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px'}}>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{fontSize: '1.2rem'}}>🛍️</div>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>Total Orders (7d)</div>
                      <div style={{fontSize: '1.3rem', fontWeight: '800', color: '#111', marginTop: '2px'}}>0</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>Today: 0</div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{fontSize: '1.2rem'}}>📈</div>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>Revenue (7d)</div>
                      <div style={{fontSize: '1.3rem', fontWeight: '800', color: '#111', marginTop: '2px'}}>₹0</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>This month: ₹0</div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{fontSize: '1.2rem'}}>🔥</div>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>Avg Order Value</div>
                      <div style={{fontSize: '1.3rem', fontWeight: '800', color: '#111', marginTop: '2px'}}>₹0</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>This month: ₹0</div>
                    </div>
                  </div>
                  <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{fontSize: '1.2rem'}}>⭐</div>
                    <div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>Rating</div>
                      <div style={{fontSize: '1.3rem', fontWeight: '800', color: '#111', marginTop: '2px'}}>0.0 ⭐</div>
                      <div style={{fontSize: '0.6rem', color: '#aaa', marginTop: '3px'}}>This month: 0.0 ⭐</div>
                    </div>
                  </div>
                </div>

                {/* Revenue chart */}
                <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '24px'}}>
                  <div style={{fontSize: '0.8rem', fontWeight: '700', color: '#111', marginBottom: '12px'}}>Revenue — Last 7 Days</div>
                  {/* Y-axis labels + bars */}
                  <div style={{display: 'flex', gap: '8px'}}>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18px', gap: 0}}>
                      <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹1.2</span>
                      <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.9</span>
                      <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.6</span>
                      <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0.3</span>
                      <span style={{fontSize: '0.48rem', color: '#aaa'}}>₹0</span>
                    </div>
                    <div style={{flex: 1, position: 'relative'}}>
                      {/* Grid lines */}
                      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18px', pointerEvents: 'none'}}>
                        <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                        <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                        <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                        <div style={{height: '1px', background: '#f0f0f0', width: '100%'}}></div>
                      </div>
                      {/* Chart line (flat = ₹0 data) */}
                      <div style={{height: '70px', display: 'flex', alignItems: 'flex-end', gap: 0, borderBottom: '2px solid #3b82f6', paddingBottom: 0, position: 'relative'}}>
                        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#3b82f6', borderRadius: '2px'}}></div>
                        <div style={{position: 'absolute', bottom: '-3px', left: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6'}}></div>
                        <div style={{position: 'absolute', bottom: '-3px', right: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6'}}></div>
                      </div>
                      {/* X labels */}
                      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>19 Apr</span>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>20 Apr</span>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>21 Apr</span>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>22 Apr</span>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>23 Apr</span>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>24 Apr</span>
                        <span style={{fontSize: '0.45rem', color: '#aaa'}}>25 Apr</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top menu items */}
                <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '24px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px'}}>
                    <span style={{fontSize: '0.9rem'}}>🏆</span>
                    <span style={{fontSize: '0.8rem', fontWeight: '700', color: '#111'}}>Top Menu Items</span>
                  </div>
                  <div style={{fontSize: '0.7rem', color: '#aaa', textAlign: 'center', padding: '8px 0'}}>No orders yet. Start accepting orders to see your top items.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile App Preview */}
          <div id="prev-mobile" className="preview-panel">
            <div style={{display: 'flex', justifyContent: 'center', gap: '32px', alignItems: 'flex-start', padding: '20px 0'}} className="reveal">

              {/* Phone 1: Home screen */}
              <div style={{
                width: '260px', height: '520px',
                background: '#fff',
                border: '3px solid #1a1a1a',
                borderRadius: '38px',
                overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(0,0,0,.7), 0 32px 72px rgba(0,0,0,.6)',
                fontFamily: 'var(--ff-body)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
              }}>
                <div style={{background: '#fff', padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: '700', color: '#111'}}>
                  <span>11:35</span><span>▲ 📶 🔋</span>
                </div>
                {/* Top bar with greeting + location */}
                <div style={{background: '#fff', padding: '4px 14px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5'}}>
                  <div>
                    <div style={{fontSize: '0.72rem', fontWeight: '700', color: '#111'}}>Hey Sarthak 👋, hungry?</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px'}}>
                    <span style={{fontSize: '0.62rem', color: '#f59e0b'}}>📍</span>
                    <span style={{fontSize: '0.62rem', fontWeight: '700', color: '#111'}}>198/155, Indore</span>
                    <span style={{fontSize: '0.55rem', color: '#f59e0b', marginLeft: '1px'}}>▾</span>
                  </div>
                </div>
                {/* Search */}
                <div style={{margin: '8px 14px', background: '#f0f0f0', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '7px'}}>
                  <span style={{fontSize: '0.75rem', color: '#aaa'}}>🔍</span>
                  <span style={{fontSize: '0.62rem', color: '#bbb', flex: 1}}>Search restaurants & dishes...</span>
                  <div style={{width: '22px', height: '22px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff'}}>🎙</div>
                </div>
                {/* Promo banner */}
                <div style={{margin: '4px 14px', background: 'linear-gradient(135deg,#f59e0b,#f97316)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0}}>
                  <div>
                    <div style={{fontSize: '0.5rem', background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: '4px', padding: '2px 6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px'}}>● LIMITED TIME</div>
                    <div style={{fontSize: '1.1rem', fontWeight: '900', color: '#fff'}}>50% OFF</div>
                    <div style={{fontSize: '0.58rem', color: 'rgba(255,255,255,.85)', marginTop: '1px'}}>On your first order</div>
                    <div style={{marginTop: '8px', background: '#fff', color: '#f59e0b', borderRadius: '8px', padding: '4px 10px', fontSize: '0.55rem', fontWeight: '800', display: 'inline-block'}}>Order Now ›</div>
                  </div>
                  <div style={{fontSize: '2.5rem', opacity: 0.4}}>🎉</div>
                </div>
                {/* Filters */}
                <div style={{display: 'flex', gap: '6px', padding: '8px 14px', overflow: 'hidden'}}>
                  <span style={{padding: '5px 12px', borderRadius: '20px', border: '1.5px solid #f59e0b', background: '#fff8e1', fontSize: '0.6rem', fontWeight: '700', color: '#f59e0b', flexShrink: 0}}>🔥 Popular</span>
                  <span style={{padding: '5px 12px', borderRadius: '20px', border: '1px solid #e5e7eb', fontSize: '0.6rem', fontWeight: '600', color: '#555', flexShrink: 0}}>⚡ Fast Delivery</span>
                  <span style={{padding: '5px 12px', borderRadius: '20px', border: '1px solid #e5e7eb', fontSize: '0.6rem', fontWeight: '600', color: '#555', flexShrink: 0}}>🥗 Pure Veg</span>
                </div>
                {/* Categories */}
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px'}}>
                  <span style={{fontSize: '0.72rem', fontWeight: '800', color: '#111'}}>What's on your mind?</span>
                  <span style={{fontSize: '0.6rem', fontWeight: '700', color: '#f59e0b'}}>See All</span>
                </div>
                <div style={{display: 'flex', gap: '10px', padding: '4px 14px'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{width: '38px', height: '38px', background: '#fff3e0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto'}}>🍚</div>
                    <div style={{fontSize: '0.5rem', color: '#555', marginTop: '3px', fontWeight: '600'}}>Biryani</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{width: '38px', height: '38px', background: '#fce4ec', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto'}}>🍕</div>
                    <div style={{fontSize: '0.5rem', color: '#555', marginTop: '3px', fontWeight: '600'}}>Pizza</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{width: '38px', height: '38px', background: '#e8f5e9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto'}}>🍔</div>
                    <div style={{fontSize: '0.5rem', color: '#555', marginTop: '3px', fontWeight: '600'}}>Burger</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{width: '38px', height: '38px', background: '#e3f2fd', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto'}}>🥡</div>
                    <div style={{fontSize: '0.5rem', color: '#555', marginTop: '3px', fontWeight: '600'}}>Chinese</div>
                  </div>
                </div>
                {/* Bottom nav */}
                <div style={{marginTop: 'auto', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-around', padding: '8px 0 5px', flexShrink: 0}}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.5rem', color: '#f59e0b', fontWeight: '700'}}>
                    <span style={{fontSize: '1rem'}}>🏠</span>Home
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.5rem', color: '#bbb', fontWeight: '600'}}>
                    <span style={{fontSize: '1rem'}}>🛒</span>Cart
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.5rem', color: '#bbb', fontWeight: '600'}}>
                    <span style={{fontSize: '1rem'}}>📦</span>Orders
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.5rem', color: '#bbb', fontWeight: '600'}}>
                    <span style={{fontSize: '1rem'}}>👤</span>Profile
                  </div>
                </div>
              </div>

              {/* Phone 2: Orders screen */}
              <div style={{
                width: '260px', height: '520px',
                background: '#fff',
                border: '3px solid #1a1a1a',
                borderRadius: '38px',
                overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(0,0,0,.7), 0 32px 72px rgba(0,0,0,.6)',
                fontFamily: 'var(--ff-body)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                marginTop: '40px',
              }}>
                <div style={{background: '#fff', padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: '700', color: '#111'}}>
                  <span>11:40</span><span>▲ 📶 🔋</span>
                </div>
                <div style={{display: 'flex', padding: '6px 14px', gap: 0, borderBottom: '1px solid #f5f5f5'}}>
                  <span style={{flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: '20px', background: '#fff3e1', fontSize: '0.62rem', fontWeight: '700', color: '#f59e0b'}}>All Orders</span>
                  <span style={{flex: 1, textAlign: 'center', padding: '6px 0', fontSize: '0.62rem', color: '#bbb'}}>Active</span>
                  <span style={{flex: 1, textAlign: 'center', padding: '6px 0', fontSize: '0.62rem', color: '#bbb'}}>Past</span>
                </div>
                {/* Date filters */}
                <div style={{display: 'flex', gap: '5px', padding: '7px 14px', overflow: 'hidden'}}>
                  <span style={{padding: '2px 7px', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '0.42rem', fontWeight: '600', color: '#555', background: '#fff', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0}}>
                    <span style={{fontSize: '0.42rem'}}>📅</span>Today
                  </span>
                  <span style={{padding: '2px 7px', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '0.42rem', fontWeight: '600', color: '#555', background: '#fff', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0}}>
                    <span style={{fontSize: '0.42rem'}}>📅</span>This Week
                  </span>
                  <span style={{padding: '2px 7px', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '0.42rem', fontWeight: '600', color: '#555', background: '#fff', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0}}>
                    <span style={{fontSize: '0.42rem'}}>📅</span>This Month
                  </span>
                </div>
                {/* Active order */}
                <div style={{margin: '0 14px 6px', border: '1.5px solid #e3f2fd', borderRadius: '10px', padding: '8px 10px', background: '#fff'}}>
                  <div style={{fontSize: '0.42rem', color: '#555', fontWeight: '600', marginBottom: '3px'}}>Order in Progress</div>
                  <div style={{fontSize: '0.62rem', fontWeight: '800', color: '#111'}}>Burger Barn</div>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px'}}>
                    <div style={{fontSize: '0.4rem', color: '#1565c0', background: '#e3f2fd', borderRadius: '20px', padding: '2px 7px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px'}}>
                      <span style={{fontSize: '0.4rem'}}>🏪</span> Placed
                    </div>
                    <span style={{fontSize: '0.44rem', fontWeight: '700', color: '#f59e0b'}}>Track ›</span>
                  </div>
                </div>
                <div style={{fontSize: '0.48rem', fontWeight: '700', color: '#111', padding: '0 14px 4px'}}>All Orders (1)</div>
                {/* Past order */}
                <div style={{margin: '0 14px 6px', border: '1px solid #f0f0f0', borderRadius: '10px', padding: '8px 10px', background: '#fff'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px'}}>
                    <div style={{width: '20px', height: '20px', borderRadius: '5px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0}}>🍽️</div>
                    <div>
                      <div style={{fontSize: '0.52rem', fontWeight: '700', color: '#111'}}>Spice Garden</div>
                      <div style={{fontSize: '0.4rem', color: '#aaa', marginTop: '1px'}}>25-Mar-2026, 6:10 pm</div>
                    </div>
                    <div style={{marginLeft: 'auto', fontSize: '0.4rem', fontWeight: '700', color: '#2e7d32', background: '#e8f5e9', borderRadius: '20px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '2px'}}>
                      <span style={{fontSize: '0.4rem'}}>✅</span> Delivered
                    </div>
                  </div>
                  <div style={{fontSize: '0.42rem', color: '#888', marginBottom: '5px'}}>Items not available</div>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div>
                      <span style={{fontSize: '0.5rem', fontWeight: '700', color: '#111'}}>₹267</span>
                      <span style={{fontSize: '0.42rem', color: '#aaa'}}> · 0 items</span>
                    </div>
                    <div style={{display: 'flex', gap: '4px'}}>
                      <span style={{fontSize: '0.42rem', fontWeight: '700', color: '#f59e0b', background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: '6px', padding: '3px 7px'}}>
                        <span style={{fontSize: '0.42rem'}}>↺ Reorder</span>
                      </span>
                      <span style={{fontSize: '0.42rem', fontWeight: '600', color: '#555', background: '#f5f5f5', borderRadius: '6px', padding: '3px 7px'}}>
                        <span style={{fontSize: '0.42rem'}}>Details ›</span>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Bottom nav */}
                <div style={{marginTop: 'auto', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-around', padding: '5px 0 3px', flexShrink: 0}}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', fontSize: '0.38rem', color: '#bbb', fontWeight: '600'}}>
                    <span style={{fontSize: '0.75rem'}}>🏠</span>Home
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', fontSize: '0.38rem', color: '#bbb', fontWeight: '600'}}>
                    <span style={{fontSize: '0.75rem'}}>🛒</span>Cart
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', fontSize: '0.38rem', color: '#f59e0b', fontWeight: '600'}}>
                    <span style={{fontSize: '0.75rem'}}>📦</span>Orders
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', fontSize: '0.38rem', color: '#bbb', fontWeight: '600'}}>
                    <span style={{fontSize: '0.75rem'}}>👤</span>Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="arch">
        <div className="container">
          <div className="arch-header reveal">
            <div className="eyebrow">System Architecture</div>
            <h2 className="display-heading">
              FOUR TIERS.<br />
              <span className="serif-accent">one coherent</span> SYSTEM.
            </h2>
            <p className="body-text">
              Every component communicates through well-defined interfaces. The API layer holds all business logic — clients are intentionally kept thin.
            </p>
          </div>
          <div className="arch-diagram reveal delay-1">
            <div className="arch-tier">
              <div className="arch-tier-label">CLIENT LAYER</div>
              <div className="arch-nodes">
                <div className="arch-node">📱 Customer App<br /><small>React Native</small></div>
                <div className="arch-node">🛵 Agent App<br /><small>React Native</small></div>
                <div className="arch-node">🍽️ Vendor Panel<br /><small>React SPA</small></div>
                <div className="arch-node">🖥️ Admin Panel<br /><small>React SPA (unified)</small></div>
              </div>
            </div>
            <div className="arch-connector">HTTPS / REST + WebSocket</div>
            <div className="arch-tier">
              <div className="arch-tier-label">API GATEWAY + LOAD BALANCER</div>
              <div className="arch-nodes">
                <div className="arch-node hi">SSL/TLS Termination</div>
                <div className="arch-node hi">Rate Limiting</div>
                <div className="arch-node hi">Request Routing</div>
                <div className="arch-node hi">CORS Enforcement</div>
                <div className="arch-node hi">Health Check Probes</div>
              </div>
            </div>
            <div className="arch-connector">Express / NestJS Middleware Chain</div>
            <div className="arch-tier">
              <div className="arch-tier-label">UNIFIED NODE.js REST API</div>
              <div className="arch-nodes">
                <div className="arch-node">AuthService</div>
                <div className="arch-node">OrderService</div>
                <div className="arch-node">PaymentService</div>
                <div className="arch-node">DeliveryService</div>
                <div className="arch-node">MenuService</div>
                <div className="arch-node">NotificationService</div>
                <div className="arch-node">RestaurantService</div>
                <div className="arch-node">CouponService</div>
                <div className="arch-node">ReviewService</div>
                <div className="arch-node">ReportService</div>
                <div className="arch-node">SupportService</div>
                <div className="arch-node">CommissionService</div>
                <div className="arch-node">SettingsService</div>
              </div>
            </div>
            <div className="arch-connector">ORM · In-Process EventEmitter · External APIs</div>
            <div className="arch-tier">
              <div className="arch-tier-label">DATA & SERVICES LAYER</div>
              <div className="arch-nodes">
                <div className="arch-node">🐘 PostgreSQL 15+</div>
                <div className="arch-node">⚡ Redis 7+</div>
                <div className="arch-node">☁️ AWS S3 / R2</div>
                <div className="arch-node">💳 Razorpay</div>
                <div className="arch-node">🔔 FCM + APNs</div>
                <div className="arch-node">📱 MSG91 / Twilio</div>
                <div className="arch-node">📧 SendGrid</div>
                <div className="arch-node">📡 Socket.IO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section id="tech">
        <div className="container">
          <div className="tech-header reveal">
            <div className="eyebrow">Technology Stack</div>
            <h2 className="display-heading">
              BUILT ON A<br />
              <span className="serif-accent">modern,</span> PROVEN STACK
            </h2>
            <p className="body-text">
              Every technology choice is deliberate — optimised for developer velocity, operational resilience, and horizontal scalability from day one.
            </p>
          </div>
          <div className="tech-grid reveal delay-1">
            <div className="tcat">
              <div className="tcat-head">📱 Mobile Apps</div>
              <div className="ttags">
                <span className="ttag">React Native</span>
                <span className="ttag">TypeScript</span>
                <span className="ttag">Redux Toolkit</span>
                <span className="ttag">React Query</span>
                <span className="ttag">React Navigation</span>
                <span className="ttag">Axios</span>
                <span className="ttag">Razorpay RN SDK</span>
                <span className="ttag">react-native-firebase</span>
                <span className="ttag">RN Maps</span>
                <span className="ttag">SecureStore</span>
              </div>
            </div>
            <div className="tcat">
              <div className="tcat-head">🌐 Web App</div>
              <div className="ttags">
                <span className="ttag">React + Vite</span>
                <span className="ttag">TypeScript</span>
                <span className="ttag">React Router v6</span>
                <span className="ttag">Redux Toolkit</span>
                <span className="ttag">React Query</span>
                <span className="ttag">Socket.IO Client</span>
                <span className="ttag">Ant Design</span>
                <span className="ttag">Shadcn/UI</span>
                <span className="ttag">React Hook Form</span>
                <span className="ttag">Zod</span>
                <span className="ttag">Recharts</span>
              </div>
            </div>
            <div className="tcat">
              <div className="tcat-head">⚙️ API & Backend</div>
              <div className="ttags">
                <span className="ttag">Node.js LTS v20+</span>
                <span className="ttag">Express.js</span>
                <span className="ttag">NestJS</span>
                <span className="ttag">TypeScript</span>
                <span className="ttag">Prisma / TypeORM</span>
                <span className="ttag">Socket.IO</span>
                <span className="ttag">JWT</span>
                <span className="ttag">Zod / Joi</span>
                <span className="ttag">OpenAPI 3.0</span>
                <span className="ttag">Swagger</span>
                <span className="ttag">PM2</span>
              </div>
            </div>
            <div className="tcat">
              <div className="tcat-head">🏗️ Infra & Integrations</div>
              <div className="ttags">
                <span className="ttag">PostgreSQL 15+</span>
                <span className="ttag">Redis 7+</span>
                <span className="ttag">AWS S3 / R2</span>
                <span className="ttag">CloudFront CDN</span>
                <span className="ttag">Docker</span>
                <span className="ttag">GitHub Actions</span>
                <span className="ttag">ECS Fargate</span>
                <span className="ttag">Razorpay</span>
                <span className="ttag">FCM + APNs</span>
                <span className="ttag">MSG91/Twilio</span>
                <span className="ttag">SendGrid</span>
                <span className="ttag">Sentry</span>
                <span className="ttag">Prometheus</span>
                <span className="ttag">Grafana</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY FOODBRIDGE */}
      <section id="why">
        <div className="container">
          <div className="why-header reveal">
            <div className="eyebrow">Why FoodBridge</div>
            <h2 className="display-heading">
              DESIGNED FOR<br />
              <span className="serif-accent">real-world</span> SCALE
            </h2>
          </div>
          <div className="why-grid">
            <div className="why-card reveal">
              <div className="why-card-header">
                <div className="why-icon">🏗️</div>
                <h3>Modular by Design</h3>
              </div>
              <p>Each service module is cleanly isolated with well-defined interfaces. Features can be developed, tested, and deployed independently — without disrupting the rest of the platform.</p>
            </div>
            <div className="why-card reveal delay-1">
              <div className="why-card-header">
                <div className="why-icon">⚡</div>
                <h3>Real-Time First</h3>
              </div>
              <p>Socket.IO WebSocket connections power every live experience — order boards, kitchen displays, and customer tracking all update instantly with zero polling overhead.</p>
            </div>
            <div className="why-card reveal delay-2">
              <div className="why-card-header">
                <div className="why-icon">🔐</div>
                <h3>Security at Every Layer</h3>
              </div>
              <p>RBAC enforced on every endpoint, HMAC-verified payment webhooks, JWT with short-lived access tokens, OTP-only authentication, and rate limiting at the gateway layer.</p>
            </div>
            <div className="why-card reveal">
              <div className="why-card-header">
                <div className="why-icon">📱</div>
                <h3>Unified Codebase</h3>
              </div>
              <p>One React Native codebase for iOS and Android. One React SPA for Vendor and Admin. One Node.js API for all clients. Zero duplication, maximum consistency.</p>
            </div>
            <div className="why-card reveal delay-1">
              <div className="why-card-header">
                <div className="why-icon">☁️</div>
                <h3>Cloud-Native Infrastructure</h3>
              </div>
              <p>Containerised with Docker, deployed via GitHub Actions CI/CD to AWS ECS Fargate. Auto-scaling, zero-downtime deploys, and Sentry + Grafana observability built in.</p>
            </div>
            <div className="why-card reveal delay-2">
              <div className="why-card-header">
                <div className="why-icon">📊</div>
                <h3>Data-Driven Operations</h3>
              </div>
              <p>Pre-aggregated analytics for every role — vendors track sales and commissions, admins monitor platform health, and everyone exports to CSV with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="container">
          <div className="testi-header reveal">
            <div className="eyebrow">Built for Everyone</div>
            <h2 className="display-heading">
              WHAT EACH ROLE<br />
              <span className="serif-accent">gets to</span> EXPERIENCE
            </h2>
          </div>
          <div className="testi-grid">
            <div className="tcard reveal">
              <div className="tcard-stars">★★★★★</div>
              <p className="tcard-text">"From finding a restaurant to tracking my delivery in real time — the app feels instant. The coupon engine actually works, and I love being able to rate and review after every order."</p>
              <div className="tcard-author">
                <div className="tcard-avatar">🙋</div>
                <div>
                  <div className="tcard-author-name">Priya Sharma</div>
                  <div className="tcard-author-role">Customer · Bangalore</div>
                </div>
              </div>
            </div>
            <div className="tcard reveal delay-1">
              <div className="tcard-stars">★★★★★</div>
              <p className="tcard-text">"The real-time order board changed everything. Orders appear the second they're placed, the kitchen display keeps my team in sync, and the sales reports help me make smarter decisions every week."</p>
              <div className="tcard-author">
                <div className="tcard-avatar">👨‍🍳</div>
                <div>
                  <div className="tcard-author-name">Ravi Patel</div>
                  <div className="tcard-author-role">Restaurant Owner · Mumbai</div>
                </div>
              </div>
            </div>
            <div className="tcard reveal delay-2">
              <div className="tcard-stars">★★★★★</div>
              <p className="tcard-text">"The agent app is incredibly simple — go online, get the task notification, tap to navigate, confirm delivery. That's it. Commission is calculated automatically. No paperwork, no confusion."</p>
              <div className="tcard-author">
                <div className="tcard-avatar">🛵</div>
                <div>
                  <div className="tcard-author-name">Arjun Singh</div>
                  <div className="tcard-author-role">Delivery Agent · Delhi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap">
        <div className="container">
          <div className="roadmap-header reveal">
            <div className="eyebrow">Product Roadmap</div>
            <h2 className="display-heading">
              WHERE WE<br />
              <span className="serif-accent">are headed</span>
            </h2>
            <p className="body-text">
              FoodBridge is built in clearly defined phases. Here's a transparent view of what's shipped, what's in progress, and what's coming next.
            </p>
          </div>
          <div className="roadmap-grid">
            <div className="rm-card done reveal">
              <div className="rm-phase">✓ Foundation Complete</div>
              <div className="rm-title">Phase 1 — Core Platform</div>
              <div className="rm-list">
                <div className="rm-item">Authentication system (OTP + JWT)</div>
                <div className="rm-item">Restaurant onboarding & approval flow</div>
                <div className="rm-item">Menu, categories, variants & modifiers</div>
                <div className="rm-item">Order lifecycle (Delivery, Dine-In, Takeaway)</div>
                <div className="rm-item">Razorpay payment integration</div>
                <div className="rm-item">Role-based access control (8 roles)</div>
              </div>
            </div>
            <div className="rm-card progress reveal delay-1">
              <div className="rm-phase">⚡ In Progress</div>
              <div className="rm-title">Phase 2 — Real-Time & Ops</div>
              <div className="rm-list">
                <div className="rm-item">Socket.IO real-time order board</div>
                <div className="rm-item">Kitchen display system</div>
                <div className="rm-item">Delivery agent task management</div>
                <div className="rm-item">FCM / APNs push notifications</div>
                <div className="rm-item">Commission engine & payout reports</div>
                <div className="rm-item">Support ticket system</div>
              </div>
            </div>
            <div className="rm-card upcoming reveal delay-2">
              <div className="rm-phase">📅 Upcoming</div>
              <div className="rm-title">Phase 3 — Growth Tools</div>
              <div className="rm-list">
                <div className="rm-item">Advanced analytics dashboard</div>
                <div className="rm-item">Loyalty points & rewards system</div>
                <div className="rm-item">Scheduled ordering & pre-orders</div>
                <div className="rm-item">Multi-language & localisation</div>
                <div className="rm-item">Customer re-engagement campaigns</div>
                <div className="rm-item">CSV bulk menu import</div>
              </div>
            </div>
            <div className="rm-card future reveal delay-3">
              <div className="rm-phase">🔭 Future</div>
              <div className="rm-title">Phase 4 — Scale</div>
              <div className="rm-list">
                <div className="rm-item">Microservices migration</div>
                <div className="rm-item">AI-powered demand forecasting</div>
                <div className="rm-item">Dynamic surge pricing</div>
                <div className="rm-item">White-label platform offering</div>
                <div className="rm-item">Multi-city & multi-region support</div>
                <div className="rm-item">Partner marketplace & integrations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats">
        <div className="container">
          <div className="stats-row">
            <div className="sitem reveal">
              <div className="snum" data-target="4">0<em className="se">+</em></div>
              <div className="slabel">Client Applications</div>
            </div>
            <div className="sitem reveal delay-1">
              <div className="snum" data-target="8">0<em className="se">+</em></div>
              <div className="slabel">User Roles</div>
            </div>
            <div className="sitem reveal delay-2">
              <div className="snum" data-target="13">0<em className="se">+</em></div>
              <div className="slabel">Service Modules</div>
            </div>
            <div className="sitem reveal delay-3">
              <div className="snum" data-target="14">0<em className="se">+</em></div>
              <div className="slabel">Notification Events</div>
            </div>
            <div className="sitem reveal delay-4">
              <div className="snum static">99<em className="se">.5%</em></div>
              <div className="slabel">Uptime SLA Target</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="container">
          <div className="cta-box reveal">
            <div className="cta-text">
              <div className="eyebrow">Ready to Bridge the Gap?</div>
              <h2 className="display-heading">
                THE COMPLETE<br />
                <span className="serif-accent">food delivery</span><br />
                ECOSYSTEM AWAITS
              </h2>
              <p className="body-text">
                From the customer's first tap to the admin's final report — FoodBridge connects every actor, every order, and every insight through one powerful, unified platform.
              </p>
            </div>
            <div className="cta-actions">
              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="btn btn-amber btn-lg">🚀 Explore Features</a>
              <a href="#platforms" onClick={(e) => handleSmoothScroll(e, 'platforms')} className="btn btn-outline btn-lg">📱 View Applications →</a>
              <div className="cta-trust">
                <span>🔒</span> Production-grade security · Built for scale
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a className="nav-logo" href="#">FOOD<span className="accent">BRIDGE</span></a>
              <p>A complete multi-vendor food delivery and restaurant management ecosystem — built for scale, reliability, and every actor in the chain.</p>
            </div>
            <div className="footer-col">
              <h5>Platform</h5>
              <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')}>About FoodBridge</a>
              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')}>Core Features</a>
              <a href="#how" onClick={(e) => handleSmoothScroll(e, 'how')}>How It Works</a>
              <a href="#platforms" onClick={(e) => handleSmoothScroll(e, 'platforms')}>Applications</a>
              <a href="#roadmap" onClick={(e) => handleSmoothScroll(e, 'roadmap')}>Roadmap</a>
            </div>
            <div className="footer-col">
              <h5>Technology</h5>
              <a href="#arch" onClick={(e) => handleSmoothScroll(e, 'arch')}>Architecture</a>
              <a href="#tech" onClick={(e) => handleSmoothScroll(e, 'tech')}>Tech Stack</a>
              <a href="#tech" onClick={(e) => handleSmoothScroll(e, 'tech')}>Integrations</a>
              <a href="#tech" onClick={(e) => handleSmoothScroll(e, 'tech')}>API Reference</a>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <a href="#">Engineering Team</a>
              <a href="#">Documentation</a>
              <a href="#">Roadmap</a>
              <a href="#cta" onClick={(e) => handleSmoothScroll(e, 'cta')}>Get in Touch</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 FoodBridge Ecosystem · Multi-Vendor Food Delivery Platform · v1.0 · CONFIDENTIAL</p>
            <div className="socials">
              <a href="#" className="soc" aria-label="X / Twitter">𝕏</a>
              <a href="#" className="soc" aria-label="LinkedIn">in</a>
              <a href="#" className="soc" aria-label="GitHub">gh</a>
              <a href="#" className="soc" aria-label="Instagram">◎</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
