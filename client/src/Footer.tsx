import { useEffect, useState, type ReactNode } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Phone,
  Mail,
  MapPin,
  ArrowUp,
  Clock,
  ArrowRight,
  PhoneCall,
  Laptop
} from "lucide-react";

/* WhatsApp glyph — kept consistent with the icon used across the rest of the site */
function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" width={size} height={size}>
      <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.4.67 4.63 1.83 6.55L4 29l7.66-2c1.82.94 3.9 1.48 6.36 1.48 6.62 0 12-5.36 12-12S22.64 3 16.02 3zm0 21.86c-2.13 0-4.13-.6-5.83-1.63l-.42-.25-4.32 1.13 1.15-4.2-.27-.43C5.3 17.9 4.6 16.5 4.6 15c0-6.3 5.12-11.42 11.42-11.42S27.44 8.7 27.44 15 22.32 24.86 16.02 24.86zm6.28-8.6c-.34-.17-2-1-2.3-1.1-.31-.12-.53-.17-.76.17-.22.34-.87 1.1-1.07 1.32-.2.23-.4.26-.73.09-.34-.17-1.42-.52-2.7-1.66-1-.9-1.67-2-1.87-2.33-.2-.34-.02-.52.15-.69.15-.15.34-.4.5-.6.17-.2.22-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.76-1.83-1.04-2.5-.27-.65-.55-.56-.76-.57l-.65-.01c-.22 0-.58.08-.89.43-.3.34-1.16 1.14-1.16 2.78s1.19 3.22 1.36 3.44c.17.23 2.34 3.58 5.68 5.02.79.34 1.4.55 1.89.7.79.25 1.51.22 2.08.13.63-.1 2-.82 2.28-1.6.28-.79.28-1.47.2-1.6-.08-.14-.31-.23-.65-.4z" />
    </svg>
  );
}

const categoryLinks = [
  "Business Laptops",
  "Gaming Laptops",
  "Student Laptops",
  "Desktops",
  "Workstations",
  "Printers",
  "Networking",
  "Accessories"
];

const quickLinks = [
  { label: "Home", href: "#" },
  { label: "About Us", href: "#why-different" },
  { label: "Brands", href: "#brands" },
  { label: "Products", href: "#products" },
  { label: "Business Solutions", href: "#solutions" },
  { label: "Contact", href: "#contact" },
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms & Conditions", href: "#terms" }
];

const socialLinks: { label: string; href: string; node: ReactNode }[] = [
  { label: "Facebook", href: "https://facebook.com", node: <Facebook size={17} strokeWidth={1.8} /> },
  { label: "Instagram", href: "https://instagram.com", node: <Instagram size={17} strokeWidth={1.8} /> },
  { label: "LinkedIn", href: "https://linkedin.com", node: <Linkedin size={17} strokeWidth={1.8} /> },
  { label: "YouTube", href: "https://youtube.com", node: <Youtube size={17} strokeWidth={1.8} /> },
  {
    label: "WhatsApp",
    href: "https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20technology%20solution.",
    node: <WhatsAppGlyph size={17} />
  }
];

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* ============ TOP CTA BANNER ============ */}
      <section className="footer-cta-section">
        <div className="fcs-bg">
          <div className="fcs-glow fcs-glow-a"></div>
          <div className="fcs-glow fcs-glow-b"></div>
          <div className="fcs-grid"></div>
        </div>

        <div className="fcs-inner reveal">
          <span className="section-eyebrow fcs-eyebrow">Let&rsquo;s Get Started</span>
          <h2 className="fcs-title">Ready to Upgrade Your Technology?</h2>
          <p className="fcs-sub">
            Whether you need a single laptop or complete IT infrastructure for your organization, P.C. Care is
            here to help.
          </p>

          <div className="fcs-ctas">
            <a href="#products" className="fcs-btn fcs-btn-primary">
              <Laptop size={17} />
              Explore Products
            </a>
            <a href="#contact" className="fcs-btn fcs-btn-glass">
              <ArrowRight size={16} />
              Get Free Quote
            </a>
            <a
              href="https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20technology%20solution."
              target="_blank"
              rel="noopener noreferrer"
              className="fcs-btn fcs-btn-whatsapp"
            >
              <WhatsAppGlyph size={17} />
              WhatsApp Now
            </a>
          </div>
        </div>
      </section>

      {/* ============ ULTRA-PREMIUM FOOTER ============ */}
      <footer className="site-footer" id="site-footer">
        <div className="footer-bg">
          <div className="fg-beam fg-beam-a"></div>
          <div className="fg-beam fg-beam-b"></div>
          <div className="fg-grid"></div>
          <div className="fg-vignette"></div>
        </div>

        {/* ---- Business Hours strip ---- */}
        <div className="footer-hours-bar reveal">
          <span className="fhb-icon">
            <Clock size={15} />
          </span>
          <span className="fhb-text">
            <b>Business Hours</b> &mdash; Monday &ndash; Saturday, 10:00 AM &ndash; 8:00 PM
          </span>
        </div>

        {/* ---- Main footer grid ---- */}
        <div className="footer-main reveal">
          {/* COLUMN 1 — ABOUT */}
          <div className="footer-col footer-col-about">
            <a href="#" className="footer-brand" aria-label="P.C. Care — Home">
              <div className="footer-brand-mark">
                <span>PC</span>
                <div className="footer-pulse-dot"></div>
              </div>
              <div className="footer-brand-text">
                <span className="fb1">P.C. Care</span>
                <span className="fb2">Sagar</span>
              </div>
            </a>

            <p className="footer-about-text">
              P.C. Care is a trusted laptop, desktop and IT solutions partner serving customers across Madhya
              Pradesh since 2005.
            </p>

            <div className="footer-social-row">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-icon"
                  aria-label={s.label}
                >
                  {s.node}
                </a>
              ))}
            </div>
          </div>

          {/* COLUMN 2 — PRODUCT CATEGORIES */}
          <div className="footer-col">
            <h5 className="footer-col-title">Product Categories</h5>
            <ul className="footer-link-list">
              {categoryLinks.map((c) => (
                <li key={c}>
                  <a href="#products">
                    <span className="fl-arrow">
                      <ArrowRight size={12} />
                    </span>
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3 — QUICK LINKS */}
          <div className="footer-col">
            <h5 className="footer-col-title">Quick Links</h5>
            <ul className="footer-link-list footer-link-underline">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4 — CONTACT */}
          <div className="footer-col footer-col-contact">
            <h5 className="footer-col-title">Contact</h5>

            <div className="footer-branch">
              <span className="footer-branch-badge">
                <MapPin size={12} />
                Sagar Branch
              </span>
              <p className="footer-branch-address">
                Near HDFC Bank, Bada Jeena,
                <br />
                Parkota Ward, Sagar, MP
              </p>
              <a className="footer-contact-row" href="tel:+919826828666">
                <Phone size={14} />
                +91 98268 28666
              </a>
              <a className="footer-contact-row" href="tel:+917582408666">
                <PhoneCall size={14} />
                07582-408666
              </a>
              <a className="footer-contact-row" href="mailto:pccaresagar@yahoo.com">
                <Mail size={14} />
                pccaresagar@yahoo.com
              </a>
            </div>

            <div className="footer-branch-divider"></div>

            <div className="footer-branch">
              <span className="footer-branch-badge footer-branch-badge-alt">
                <MapPin size={12} />
                Jabalpur Branch
              </span>
              <p className="footer-branch-address">
                Napier Town,
                <br />
                Jabalpur, MP
              </p>
              <a className="footer-contact-row" href="tel:+919826808666">
                <Phone size={14} />
                +91 98268 08666
              </a>
              <a className="footer-contact-row" href="tel:+917614900666">
                <PhoneCall size={14} />
                0761-4900666
              </a>
              <a className="footer-contact-row" href="tel:+919826828999">
                <Phone size={14} />
                Sales: +91 98268 28999
              </a>
            </div>
          </div>
        </div>

        {/* ---- Bottom strip ---- */}
        <div className="footer-bottom">
          <p className="fb-copy">&copy; 2026 P.C. Care. All Rights Reserved.</p>
          <p className="fb-tagline">
            Designed with <span className="fb-heart">&hearts;</span> for Premium Technology Solutions.
          </p>
          <div className="fb-legal">
            <a href="#privacy">Privacy Policy</a>
            <span className="fb-dot">&middot;</span>
            <a href="#terms">Terms</a>
            <span className="fb-dot">&middot;</span>
            <a href="#sitemap">Sitemap</a>
          </div>
        </div>
      </footer>

      {/* ============ FLOATING ACTION BUTTONS ============ */}
      <div className="footer-fab-stack">
        <a
          className="footer-fab footer-fab-whatsapp"
          href="https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20technology%20solution."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppGlyph size={24} />
          <span className="footer-fab-ping"></span>
        </a>
        <a className="footer-fab footer-fab-call" href="tel:+919826828666" aria-label="Call P.C. Care">
          <PhoneCall size={21} strokeWidth={2} />
        </a>
        <button
          className={`footer-fab footer-fab-top ${showScrollTop ? "is-visible" : ""}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} strokeWidth={2.2} />
        </button>
      </div>
    </>
  );
}
