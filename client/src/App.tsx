import { useEffect, useState, useRef, CSSProperties } from "react";
import FeaturedProducts from "./FeaturedProducts";
import BusinessSolutions from "./BusinessSolutions";
import Contact from "./Contact";
import WhyDifferent from "./WhyDifferent";
import Footer from "./Footer";
import heroProducts from "../assets/main.jpg";

const brandsList = [
  { slug: "hp", name: "HP" },
  { slug: "dell", name: "Dell" },
  { slug: "lenovo", name: "Lenovo" },
  { slug: "apple", name: "Apple" },
  { slug: "asus", name: "ASUS" },
  { slug: "acer", name: "Acer" },
  { slug: "msi", name: "MSI" },
  { slug: "canon", name: "Canon" },
  { slug: "epson", name: "Epson" },
  { slug: "brother", name: "Brother" },
  { slug: "samsung", name: "Samsung" },
  { slug: "lg", name: "LG" },
  { slug: "tplink", name: "TP-Link" },
  { slug: "logitech", name: "Logitech" },
  { slug: "intel", name: "Intel" },
  { slug: "amd", name: "AMD" }
];

const BRAND_ICON_SLUGS: Record<string, string | null> = {
  hp: "hp",
  dell: "dell",
  lenovo: "lenovo",
  apple: "apple",
  asus: "asus",
  acer: "acer",
  msi: "msi",
  canon: null,
  epson: "epson",
  brother: null,
  samsung: "samsung",
  lg: "lg",
  tplink: "tplink",
  logitech: "logitech",
  intel: "intel",
  amd: "amd",
};

function brandIconUrl(slug: string) {
  const iconSlug = BRAND_ICON_SLUGS[slug];
  if (!iconSlug) return null;
  return `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${iconSlug}.svg`;
}

const categoriesList = [
  {
    name: "Laptops",
    tag: "Computing",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "Desktops",
    tag: "Workstation",
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "All-in-Ones",
    tag: "Sleek PC",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "Printers",
    tag: "Printing",
    image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "Accessories",
    tag: "Peripherals",
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "CCTV",
    tag: "Security",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "Networking",
    tag: "Devices",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=500&q=80"
  }
];

function BrandImage({ 
  slug, 
  name, 
  className, 
  color = "",
  showTextOnFallback = true,
  style
}: { 
  slug: string; 
  name: string; 
  className?: string; 
  color?: string;
  showTextOnFallback?: boolean; 
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const iconUrl = brandIconUrl(slug);

  if (!iconUrl || failed) {
    if (showTextOnFallback) {
      return (
        <span className="font-sans font-extrabold text-[10px] uppercase text-gray-400 tracking-wider">
          {name}
        </span>
      );
    }
    return null;
  }

  const tintedStyle: CSSProperties = color
    ? { ...style, opacity: 0.55, filter: "grayscale(1)" }
    : (style ?? {});

  return (
    <img
      src={iconUrl}
      alt={name}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className={className}
      style={tintedStyle}
    />
  );
}

export default function App() {
  const [isElevated, setIsElevated] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("hero");
  const [hasImageError, setHasImageError] = useState(false);

  const mediaColRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        setIsElevated(true);
      } else {
        setIsElevated(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation & search autofocus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    } else {
      document.body.style.overflow = "";
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileNavOpen]);

  useEffect(() => {
    const sectionIds = [
      "hero",
      "brands",
      "categories",
      "products",
      "business-solutions",
      "contact",
      "why-different"
    ];

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) return;

    const updateActiveSection = () => {
      const anchor = window.innerHeight * 0.35;
      let current = sections[0].id;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= anchor) {
          current = section.id;
        } else {
          break;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  // Subtle parallax on hero image
  useEffect(() => {
    const mediaCol = mediaColRef.current;
    const img = imgRef.current;
    if (!mediaCol || !img) return;

    const supportsHover = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!supportsHover || reducedMotion) return;

    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    let frameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mediaCol.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) - 0.5;
      targetY = ((e.clientY - rect.top) / rect.height) - 0.5;
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    mediaCol.addEventListener("mousemove", handleMouseMove);
    mediaCol.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      curX += (targetX - curX) * 0.03;
      curY += (targetY - curY) * 0.03;
      img.style.marginLeft = `${curX * 12}px`;
      img.style.marginTop = `${curY * 8}px`;
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      mediaCol.removeEventListener("mousemove", handleMouseMove);
      mediaCol.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // IntersectionObserver for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll(".reveal, .trust-item");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleAccordion = (name: string) => {
    if (activeAccordion === name) {
      setActiveAccordion(null);
    } else {
      setActiveAccordion(name);
    }
  };

  return (
    <>
      {/* ============ HEADER ============ */}
      <header className={`site-header ${isElevated ? "is-elevated" : ""}`} id="siteHeader">
        <div className="header-inner">
          {/* Logo */}
          <a href="#hero" className="brand" aria-label="P.C. Care Sagar — Home">
            <div className="brand-mark">
              <span>PC</span>
              <div className="pulse-dot"></div>
            </div>
            <div className="brand-text">
              <span className="b1">P.C. Care</span>
              <span className="b2">Sagar</span>
            </div>
          </a>

          {/* Center Nav */}
          <nav className="main-nav" aria-label="Primary">
            <div className={`nav-item ${activeSection === "hero" ? "active" : ""}`}>
              <a href="#hero" className="nav-link">Home</a>
            </div>

            <div className={`nav-item has-brands ${activeSection === "brands" ? "active" : ""}`}>
              <a href="#brands" className="nav-link">
                Brands
                <svg className="chev" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <div className="brands-panel">
                <div className="brands-grid">
                  {brandsList.map((brand, i) => (
                    <a href="#" className="brand-tile" aria-label={brand.name} key={i}>
                      <BrandImage slug={brand.slug} name={brand.name} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className={`nav-item ${activeSection === "categories" ? "active" : ""}`}>
              <a href="#categories" className="nav-link">Categories</a>
            </div>

            <div className={`nav-item has-mega ${activeSection === "products" ? "active" : ""}`}>
              <a href="#products" className="nav-link">
                Products
                <svg className="chev" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <div className="mega-panel">
                <div className="mega-inner">
                  <div className="mega-cats">
                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M4 19V6a2 2 0 012-2h10l4 4v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">Laptops</div>
                        <div className="cat-count">80+ models</div>
                      </div>
                    </div>

                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="6" y="4" width="9" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M9.5 20h2M10.5 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">Desktops</div>
                        <div className="cat-count">35+ models</div>
                      </div>
                    </div>

                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M6 8V4h12v4M6 17h12v4H6v-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          <rect x="3" y="8" width="18" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="17" cy="11.3" r=".9" fill="currentColor" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">Printers</div>
                        <div className="cat-count">24 models</div>
                      </div>
                    </div>

                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="12" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">All-in-One PCs</div>
                        <div className="cat-count">12 models</div>
                      </div>
                    </div>

                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="9" width="7" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                          <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">IT Peripherals</div>
                        <div className="cat-count">120+ items</div>
                      </div>
                    </div>

                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M16 10.5l5-2.5v9l-5-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="9.5" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">CCTV</div>
                        <div className="cat-count">18 setups</div>
                      </div>
                    </div>

                    <div className="mega-cat">
                      <div className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="5" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M7 14v2M12 14v2M17 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <circle cx="16" cy="8" r=".8" fill="currentColor" />
                          <circle cx="7" cy="19" r="1" stroke="currentColor" strokeWidth="1.4" />
                          <circle cx="12" cy="19" r="1" stroke="currentColor" strokeWidth="1.4" />
                          <circle cx="17" cy="19" r="1" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      </div>
                      <div>
                        <div className="cat-name">Networking</div>
                        <div className="cat-count">45+ items</div>
                      </div>
                    </div>
                  </div>

                  <div className="mega-side">
                    <div>
                      <div className="eyebrow">Featured</div>
                      <div className="featured-card">
                        <div className="fc-title">Enterprise-ready ultrabooks</div>
                        <div className="fc-sub">Curated business picks with on-site warranty support.</div>
                        <span className="fc-link">Explore range →</span>
                      </div>
                    </div>
                    <div className="promo-banner">
                      <div className="pb-title">Free system health check</div>
                      <div className="pb-sub">With every laptop purchase this month.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`nav-item ${activeSection === "business-solutions" ? "active" : ""}`}><a href="#business-solutions" className="nav-link">Services</a></div>
            <div className={`nav-item ${activeSection === "contact" ? "active" : ""}`}><a href="#contact" className="nav-link">Contact</a></div>
            <div className={`nav-item ${activeSection === "why-different" ? "active" : ""}`}><a href="#why-different" className="nav-link">About Us</a></div>
          </nav>

          {/* Right Actions */}
          <div className="header-actions">
            <button className="icon-btn" id="searchTrigger" aria-label="Open search" onClick={() => setIsSearchOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <a href="https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20laptop." target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <svg viewBox="0 0 32 32" fill="currentColor">
                <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.4.67 4.63 1.83 6.55L4 29l7.66-2c1.82.94 3.9 1.48 6.36 1.48 6.62 0 12-5.36 12-12S22.64 3 16.02 3zm0 21.86c-2.13 0-4.13-.6-5.83-1.63l-.42-.25-4.32 1.13 1.15-4.2-.27-.43C5.3 17.9 4.6 16.5 4.6 15c0-6.3 5.12-11.42 11.42-11.42S27.44 8.7 27.44 15 22.32 24.86 16.02 24.86zm6.28-8.6c-.34-.17-2-1-2.3-1.1-.31-.12-.53-.17-.76.17-.22.34-.87 1.1-1.07 1.32-.2.23-.4.26-.73.09-.34-.17-1.42-.52-2.7-1.66-1-.9-1.67-2-1.87-2.33-.2-.34-.02-.52.15-.69.15-.15.34-.4.5-.6.17-.2.22-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.76-1.83-1.04-2.5-.27-.65-.55-.56-.76-.57l-.65-.01c-.22 0-.58.08-.89.43-.3.34-1.16 1.14-1.16 2.78s1.19 3.22 1.36 3.44c.17.23 2.34 3.58 5.68 5.02.79.34 1.4.55 1.89.7.79.25 1.51.22 2.08.13.63-.1 2-.82 2.28-1.6.28-.79.28-1.47.2-1.6-.08-.14-.31-.23-.65-.4z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            <a href="#" className="btn-quote">Get Quote</a>

            <button className={`hamburger ${isMobileNavOpen ? "open" : ""}`} id="hamburgerBtn" aria-label="Open menu" onClick={() => setIsMobileNavOpen(true)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      {/* ============ SEARCH OVERLAY ============ */}
      <div className={`search-overlay ${isSearchOpen ? "open" : ""}`} id="searchOverlay" onClick={(e) => e.target === e.currentTarget && setIsSearchOpen(false)}>
        <button className="search-close" id="searchClose" aria-label="Close search" onClick={() => setIsSearchOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="search-box">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input ref={searchInputRef} type="text" placeholder="Search laptops, brands, processors..." autoComplete="off" />
          </div>
          <div className="search-filters">
            <span className="sf">Laptop Name</span>
            <span className="sf">Brand</span>
            <span className="sf">Category</span>
            <span className="sf">Processor</span>
            <span className="sf">RAM</span>
            <span className="sf">SSD</span>
          </div>
          <div className="search-hint">Press Esc to close · Try "i7 16GB gaming laptop"</div>
        </div>
      </div>

      {/* ============ MOBILE NAV ============ */}
      <div className={`mobile-nav ${isMobileNavOpen ? "open" : ""}`} id="mobileNav">
        <div className="mobile-nav-top">
          <div className="brand" style={{ pointerEvents: "none" }}>
            <div className="brand-mark"><span>PC</span><div className="pulse-dot"></div></div>
            <div className="brand-text"><span className="b1">P.C. Care</span><span className="b2">Sagar</span></div>
          </div>
          <button className="mobile-nav-close" id="mobileNavClose" aria-label="Close menu" onClick={() => setIsMobileNavOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mobile-links">
          <a href="#hero" className={`m-link ${activeSection === "hero" ? "active" : ""}`} onClick={() => setIsMobileNavOpen(false)}>Home</a>

          <button className={`m-link m-accordion-trigger ${activeAccordion === "brands" ? "expanded" : ""}`} onClick={() => toggleAccordion("brands")}>
            Brands
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="m-accordion" style={{ maxHeight: activeAccordion === "brands" ? "600px" : "0" }}>
            <div className="m-accordion-inner">
              {brandsList.map((brand, i) => (
                <a href="#brands" className="m-sub" key={i} onClick={() => setIsMobileNavOpen(false)}>
                  <BrandImage 
                    slug={brand.slug} 
                    name={brand.name} 
                    color="6b7280" 
                    showTextOnFallback={false} 
                    style={{ height: "14px", verticalAlign: "-2px", marginRight: "8px" }} 
                  />
                  {brand.name}
                </a>
              ))}
            </div>
          </div>

          <a href="#categories" className={`m-link ${activeSection === "categories" ? "active" : ""}`} onClick={() => setIsMobileNavOpen(false)}>Categories</a>

          <button className={`m-link m-accordion-trigger ${activeAccordion === "products" ? "expanded" : ""}`} onClick={() => toggleAccordion("products")}> 
            Products
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="m-accordion" style={{ maxHeight: activeAccordion === "products" ? "400px" : "0" }}>
            <div className="m-accordion-inner">
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>Laptops</a>
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>Desktops</a>
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>Printers</a>
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>All-in-One PCs</a>
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>IT Peripherals</a>
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>CCTV</a>
              <a href="#products" className="m-sub" onClick={() => setIsMobileNavOpen(false)}>Networking</a>
            </div>
          </div>

          <a href="#business-solutions" className={`m-link ${activeSection === "business-solutions" ? "active" : ""}`}>Services</a>
          <a href="#contact" className={`m-link ${activeSection === "contact" ? "active" : ""}`}>Contact</a>
          <a href="#why-different" className={`m-link ${activeSection === "why-different" ? "active" : ""}`}>About Us</a>
        </div>
      </div>
      <section className="hero" id="hero">
        {/* Left: content on light background */}
        <div className="hero-content-col">
          <div className="hero-content">
            <span className="hero-eyebrow">P.C. Care · Authorised Technology Partner</span>

           <h1 className="hero-headline">
  Powering Businesses With{" "}
  <span className="grad">Premium Technology</span>
</h1>

<p className="hero-tagline">
  Trusted Laptop Dealer &amp; IT Solutions Partner
</p>

<p className="hero-sub">
  Business Laptops<span className="sep">·</span>
  Gaming Laptops<span className="sep">·</span>
  Corporate IT Solutions<span className="sep">·</span>
  Government Supply
</p>

<div className="hero-location">
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle
      cx="12"
      cy="9"
      r="2.4"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>

  Serving customers across Madhya Pradesh
</div>

<div className="hero-ctas">
  <a href="#products" className="hero-btn-primary">
    Explore Products

    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </a>

  <a href="#quote" className="hero-btn-glass">
    Get a Free Quote
  </a>

  <a
    href="https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20laptop."
    target="_blank"
    rel="noopener noreferrer"
    className="hero-btn-whatsapp"
  >
    <svg viewBox="0 0 32 32" fill="currentColor">
      <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.4.67 4.63 1.83 6.55L4 29l7.66-2c1.82.94 3.9 1.48 6.36 1.48 6.62 0 12-5.36 12-12S22.64 3 16.02 3zm0 21.86c-2.13 0-4.13-.6-5.83-1.63l-.42-.25-4.32 1.13 1.15-4.2-.27-.43C5.3 17.9 4.6 16.5 4.6 15c0-6.3 5.12-11.42 11.42-11.42S27.44 8.7 27.44 15 22.32 24.86 16.02 24.86zm6.28-8.6c-.34-.17-2-1-2.3-1.1-.31-.12-.53-.17-.76.17-.22.34-.87 1.1-1.07 1.32-.2.23-.4.26-.73.09-.34-.17-1.42-.52-2.7-1.66-1-.9-1.67-2-1.87-2.33-.2-.34-.02-.52.15-.69.15-.15.34-.4.5-.6.17-.2.22-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.76-1.83-1.04-2.5-.27-.65-.55-.56-.76-.57l-.65-.01c-.22 0-.58.08-.89.43-.3.34-1.16 1.14-1.16 2.78s1.19 3.22 1.36 3.44c.17.23 2.34 3.58 5.68 5.02.79.34 1.4.55 1.89.7.79.25 1.51.22 2.08.13.63-.1 2-.82 2.28-1.6.28-.79.28-1.47.2-1.6-.08-.14-.31-.23-.65-.4z" />
    </svg>

    WhatsApp Enquiry
  </a>
</div>

<div className="trust-row">
  <div className="trust-item">
    <div className="ti-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M4 9l8-5 8 5-8 5-8-5zM4 9v6l8 5 8-5V9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className="ti-text">
      <b>20+</b>
      <span>Global Brands</span>
    </div>
  </div>

  <div className="trust-item">
    <div className="ti-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M4 21V9l8-5 8 5v12M9 21v-6h6v6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className="ti-text">
      <b>Govt. &amp; Corporate</b>
      <span>Approved Supply</span>
    </div>
  </div>

  <div className="trust-item">
    <div className="ti-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className="ti-text">
      <b>Fast Delivery</b>
      <span>Across MP</span>
    </div>
  </div>

  <div className="trust-item">
    <div className="ti-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2.3 4.7 5.2.7-3.75 3.65.9 5.15L12 14.7l-4.65 2.5.9-5.15L4.5 8.4l5.2-.7L12 3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className="ti-text">
      <b>Since 2005</b>
      <span>Trusted Legacy</span>
    </div>
  </div>
</div>

        </div>
</div>

{/* Right: Product Image */}
<div className="hero-media-col" ref={mediaColRef}>
  <div className="blob blob-a"></div>
  <div className="blob blob-b"></div>

  <div
    className={`hero-media ${hasImageError ? "fallback" : ""}`}
    id="heroMedia"
  >
    <img
      ref={imgRef}
      src={heroProducts}
      alt="PC Care Sagar products"
      loading="eager"
      onError={() => setHasImageError(true)}
    />
  </div>

  <div className="hero-media-feather"></div>
  <div className="hero-media-vignette"></div>
  <div className="hero-media-sheen"></div>

  <div className="media-caption">
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>

    Laptops · Desktops · Printers · All-in-Ones
  </div>
</div>

<div className="scroll-indicator">
  <div className="si-pill">
    <div className="si-dot"></div>
  </div>

  <span>Scroll</span>
</div>

</section>

      {/* ============ TRUSTED GLOBAL TECHNOLOGY BRANDS + CATEGORIES ============ */}
      <section className="brands-section" id="brands">
        <div className="brands-bg">
          <div className="bb-circle bb-circle-a"></div>
          <div className="bb-circle bb-circle-b"></div>
          <div className="bb-circle bb-circle-c"></div>
          <div className="bb-grid"></div>
        </div>

        <div className="brands-header reveal">
          <span className="section-eyebrow">Our Partners</span>
          <h2 className="section-title">Trusted <span className="grad-text">Global Technology</span> Brands</h2>
          <p className="section-subtitle">We partner with the world's most trusted technology brands to deliver genuine products, enterprise solutions and reliable after-sales support across Madhya Pradesh.</p>
        </div>

        {/* Brand marquee */}
        <div className="brand-marquee-wrap reveal">
          <div className="brand-marquee">
            <div className="brand-track" id="brandTrack">
              {brandsList.map((brand, i) => (
                <div className="brand-chip" key={`b1-${i}`}>
                  <span className="bc-mono">
                    <BrandImage slug={brand.slug} name={brand.name} />
                  </span>
                  <span className="bc-name">{brand.name}</span>
                </div>
              ))}
              {/* Duplicate set for seamless infinite loop */}
              {brandsList.map((brand, i) => (
                <div className="brand-chip" key={`b2-${i}`} aria-hidden="true">
                  <span className="bc-mono">
                    <BrandImage slug={brand.slug} name={brand.name} />
                  </span>
                  <span className="bc-name">{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Four luxury glass cards */}
        <div className="trust-glass-grid reveal">
          <div className="glass-card">
            <div className="gc-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 9l8-5 8 5-8 5-8-5zM4 9v6l8 5 8-5V9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </div>
            <h4>20+ Global Brands</h4>
            <p>Authorised access to the world's leading technology manufacturers, all under one roof.</p>
          </div>
          <div className="glass-card">
            <div className="gc-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </div>
            <h4>Government &amp; Corporate Supply</h4>
            <p>Approved vendor for institutional, corporate and government procurement across MP.</p>
          </div>
          <div className="glass-card">
            <div className="gc-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </div>
            <h4>Fast Delivery Across MP</h4>
            <p>Reliable, tracked logistics ensuring your order reaches you quickly and safely.</p>
          </div>
          <div className="glass-card">
            <div className="gc-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4>Professional Technical Support</h4>
            <p>Certified engineers offering genuine after-sales service, warranty and maintenance.</p>
          </div>
        </div>

        {/* Explore Categories */}
        <div className="categories-header reveal" id="categories">
          <span className="section-eyebrow">Shop by Category</span>
          <h3 className="section-title-sm">Explore Categories</h3>
        </div>

        <div className="category-single-row-grid reveal">
          {categoriesList.map((category, i) => (
            <a 
              className="cat-card-compact" 
              href="#products" 
              key={i}
            >
              <img src={category.image} alt={category.name} loading="lazy" />
              <div className="cc-overlay"></div>
              <div className="cc-content-compact">
                <span className="cc-tag">{category.tag}</span>
                <div className="cc-title">{category.name}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ============ FEATURED / PREMIUM PRODUCT COLLECTION ============ */}
      <FeaturedProducts />

      {/* ============ ULTRA-PREMIUM BUSINESS SOLUTIONS SECTION ============ */}
      <BusinessSolutions />

      {/* ============ ULTRA-PREMIUM CONTACT & SHOWROOMS SECTION ============ */}
      <Contact />

      {/* ============ ULTRA-PREMIUM WHY P.C. CARE IS DIFFERENT SECTION ============ */}
      <WhyDifferent />

      {/* ============ ULTRA-PREMIUM CTA + FOOTER SECTION ============ */}
      <Footer />
    </>
  );
}
