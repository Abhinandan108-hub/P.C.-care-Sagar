import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Laptop,
  Users,
  Building2,
  Network,
  FileCheck2,
  ShoppingCart,
  Wrench,
  HeartHandshake,
  Monitor,
  GraduationCap,
  Wifi,
  Gamepad2,
  Palette,
  Video,
  Cpu,
  ArrowRight,
  MessageCircle,
  Phone,
  Globe2,
  Smile,
  Award,
  MapPinned
} from "lucide-react";

interface SolutionBlock {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  features: { icon: ReactNode; label: string }[];
  ctaLabel: string;
  ctaHref: string;
}

const solutionBlocks: SolutionBlock[] = [
  {
    id: "corporate",
    eyebrow: "For Corporate Offices",
    title: "Corporate Offices",
    description:
      "From bulk laptop rollouts to full office IT infrastructure, we equip growing businesses with reliable, enterprise-grade technology and dependable support.",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Modern corporate office workspace with premium laptops and desktops",
    features: [
      { icon: <Laptop size={16} />, label: "Bulk laptop deployment" },
      { icon: <Users size={16} />, label: "Employee systems" },
      { icon: <Building2 size={16} />, label: "Office setup" },
      { icon: <Network size={16} />, label: "Networking" },
      { icon: <ShoppingCart size={16} />, label: "IT procurement" }
    ],
    ctaLabel: "Request Corporate Quote",
    ctaHref: "#quote"
  },
  {
    id: "government",
    eyebrow: "For Government Departments",
    title: "Government Departments",
    description:
      "An approved and trusted technology partner for tender supply and institutional procurement, delivering reliable devices with complete installation and after-sales support.",
    image: "https://images.unsplash.com/photo-1560264280-88b68371db39?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Professional government office technology environment",
    features: [
      { icon: <FileCheck2 size={16} />, label: "Tender supply" },
      { icon: <ShoppingCart size={16} />, label: "Bulk procurement" },
      { icon: <HeartHandshake size={16} />, label: "Reliable service" },
      { icon: <Wrench size={16} />, label: "Installation support" },
      { icon: <HeartHandshake size={16} />, label: "After-sales support" }
    ],
    ctaLabel: "Talk to Sales Team",
    ctaHref: "#quote"
  },
  {
    id: "education",
    eyebrow: "For Schools & Colleges",
    title: "Schools & Colleges",
    description:
      "Empowering the next generation with fully equipped computer labs, smart classrooms and reliable devices for students and teaching staff alike.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Modern computer laboratory for schools and colleges",
    features: [
      { icon: <Monitor size={16} />, label: "Computer labs" },
      { icon: <GraduationCap size={16} />, label: "Smart classrooms" },
      { icon: <Laptop size={16} />, label: "Student laptops" },
      { icon: <Users size={16} />, label: "Teacher devices" },
      { icon: <Wifi size={16} />, label: "Networking" }
    ],
    ctaLabel: "Education Solutions",
    ctaHref: "#quote"
  },
  {
    id: "creative",
    eyebrow: "For Gaming & Creative Professionals",
    title: "Gaming & Creative Professionals",
    description:
      "High-performance rigs built for creators, editors and gamers who demand uncompromising speed, precision graphics and flawless rendering power.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Premium RGB gaming setup with high-performance PC",
    features: [
      { icon: <Gamepad2 size={16} />, label: "Gaming laptops" },
      { icon: <Palette size={16} />, label: "Graphic workstations" },
      { icon: <Video size={16} />, label: "Video editing PCs" },
      { icon: <Cpu size={16} />, label: "High-performance systems" }
    ],
    ctaLabel: "Explore Workstations",
    ctaHref: "#products"
  }
];

interface StatCard {
  icon: ReactNode;
  label: string;
  isNumber: boolean;
  target?: number;
  suffix?: string;
  value?: string;
}

const statCards: StatCard[] = [
  { icon: <Globe2 size={20} />, target: 20, suffix: "+", label: "Global Brands", isNumber: true },
  { icon: <Smile size={20} />, target: 10000, suffix: "+", label: "Happy Customers", isNumber: true },
  { icon: <Award size={20} />, value: "2005", label: "Trusted Since", isNumber: false },
  { icon: <MapPinned size={20} />, value: "MP", label: "Serving Entire Madhya Pradesh", isNumber: false }
];

function BizImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="biz-img-fallback">
        <Building2 size={34} strokeWidth={1.3} />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  );
}

function StatCounter({
  target,
  suffix,
  label,
  icon
}: {
  target: number;
  suffix: string;
  label: string;
  icon: ReactNode;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            if (reducedMotion) {
              setValue(target);
              return;
            }
            const duration = 1600;
            const startTime = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(eased * target));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div className="biz-stat-card" ref={ref}>
      <div className="bsc-icon">{icon}</div>
      <div className="bsc-value">
        {value.toLocaleString("en-IN")}
        {suffix}
      </div>
      <div className="bsc-label">{label}</div>
    </div>
  );
}

export default function BusinessSolutions() {
  const waLink = "https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20a%20custom%20IT%20solution%20for%20my%20business.";
  const callLink = "tel:+919826828666";

  return (
    <section className="biz-section" id="business-solutions">
      <div className="biz-bg">
        <div className="biz-circle biz-circle-a"></div>
        <div className="biz-circle biz-circle-b"></div>
        <div className="biz-grid"></div>
      </div>

      <div className="biz-header reveal">
        <span className="section-eyebrow">Business Solutions</span>
        <h2 className="section-title">
          Technology Solutions Built for <span className="grad-text">Every Business</span>
        </h2>
        <p className="section-subtitle">
          Helping businesses, government departments, educational institutions and professionals with
          premium technology solutions across Madhya Pradesh.
        </p>
      </div>

      <div className="biz-blocks">
        {solutionBlocks.map((block) => (
          <div className="biz-block reveal" key={block.id}>
            <div className="biz-media">
              <div className="biz-media-frame">
                <BizImage src={block.image} alt={block.imageAlt} />
                <div className="biz-media-sheen"></div>
                <div className="biz-media-vignette"></div>
              </div>
            </div>

            <div className="biz-content">
              <span className="biz-content-eyebrow">{block.eyebrow}</span>
              <h3 className="biz-content-title">{block.title}</h3>
              <p className="biz-content-desc">{block.description}</p>

              <ul className="biz-feature-list">
                {block.features.map((f) => (
                  <li key={f.label}>
                    <span className="bfl-icon">{f.icon}</span>
                    {f.label}
                  </li>
                ))}
              </ul>

              <a href={block.ctaHref} className="biz-cta-btn">
                {block.ctaLabel}
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="biz-stats-grid reveal">
        {statCards.map((s) =>
          s.isNumber ? (
            <StatCounter key={s.label} target={s.target!} suffix={s.suffix!} label={s.label} icon={s.icon} />
          ) : (
            <div className="biz-stat-card" key={s.label}>
              <div className="bsc-icon">{s.icon}</div>
              <div className="bsc-value">{s.value}</div>
              <div className="bsc-label">{s.label}</div>
            </div>
          )
        )}
      </div>

      {/* Final CTA */}
      <div className="biz-final-cta reveal">
        <div className="bfc-glow bfc-glow-a"></div>
        <div className="bfc-glow bfc-glow-b"></div>
        <div className="bfc-inner">
          <h3>Need a Custom IT Solution?</h3>
          <p>Let's build the perfect technology setup for your business.</p>
          <div className="bfc-actions">
            <a href="#quote" className="hero-btn-primary">
              Get Free Consultation
              <ArrowRight size={16} />
            </a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="hero-btn-whatsapp bfc-whatsapp">
              <MessageCircle size={17} />
              WhatsApp
            </a>
            <a href={callLink} className="bfc-call-btn">
              <Phone size={16} />
              Call Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
