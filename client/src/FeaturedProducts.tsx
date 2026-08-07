import { useEffect, useMemo, useRef, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  MessageCircle,
  Eye,
  FileText,
  Star,
  Cpu,
  MemoryStick,
  HardDrive,
  MonitorSmartphone,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  PackageCheck
} from "lucide-react";
import { products, productCategories, categoryBrandMap, filterGroups, sortOptions, type Product } from "./productsData";

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="pc-img-fallback">
        <Layers size={30} strokeWidth={1.5} />
        <span>{alt}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function FilterSection({
  title,
  icon,
  defaultOpen = false,
  children
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`filter-block ${open ? "is-open" : ""}`}>
      <button type="button" className="filter-block-head" onClick={() => setOpen((o) => !o)}>
        <span className="fb-title">
          {icon}
          {title}
        </span>
        <ChevronDown className="fb-chev" size={16} />
      </button>
      <div className="filter-block-body" style={{ maxHeight: open ? "600px" : "0px" }}>
        <div className="filter-block-inner">{children}</div>
      </div>
    </div>
  );
}

function CheckPill({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`check-pill ${active ? "active" : ""}`} onClick={onClick}>
      <span className="cp-box">{active && <Check size={11} strokeWidth={3} />}</span>
      {label}
    </button>
  );
}

const badgeIcon: Record<string, ReactNode> = {
  "AI Ready": <Sparkles size={11} />,
  "Business Ready": <ShieldCheck size={11} />,
  "Gaming Ready": <Layers size={11} />,
  "Best Seller": <Star size={11} />,
  "Latest": <Sparkles size={11} />,
  "Corporate Choice": <ShieldCheck size={11} />,
  "Student Choice": <PackageCheck size={11} />,
  "Special Offer": <Star size={11} />
};

export default function FeaturedProducts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(220000);
  const [processor, setProcessor] = useState<string[]>([]);
  const [ram, setRam] = useState<string[]>([]);
  const [storage, setStorage] = useState<string[]>([]);
  const [graphics, setGraphics] = useState<string[]>([]);
  const [os, setOs] = useState<string[]>([]);
  const [screen, setScreen] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [offer, setOffer] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("Featured");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const skeletonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (setter: Dispatch<SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  // brief skeleton pulse whenever a filter changes, for a smooth premium update feel
  const filterKey = JSON.stringify({ search, category, brands, maxPrice, processor, ram, storage, graphics, os, screen, availability, offer, sortBy });
  useEffect(() => {
    setIsLoading(true);
    if (skeletonTimer.current) clearTimeout(skeletonTimer.current);
    skeletonTimer.current = setTimeout(() => setIsLoading(false), 320);
    return () => {
      if (skeletonTimer.current) clearTimeout(skeletonTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    if (category && categoryBrandMap[category]) {
      setBrands((prev) => prev.filter((b) => categoryBrandMap[category].includes(b)));
    }
  }, [category]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    document.body.style.overflow = activeProduct ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeProduct]);

  const availableBrands = category ? categoryBrandMap[category] || [] : Array.from(new Set(Object.values(categoryBrandMap).flat()));

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (brands.length && !brands.includes(p.brand)) return false;
      if (p.price > maxPrice) return false;
      if (processor.length && !(p.processor && processor.includes(p.processor))) return false;
      if (ram.length && !(p.ram && ram.includes(p.ram))) return false;
      if (storage.length && !(p.storage && storage.includes(p.storage))) return false;
      if (graphics.length && !(p.graphics && graphics.includes(p.graphics))) return false;
      if (os.length && !(p.os && os.includes(p.os))) return false;
      if (screen.length && !(p.display && screen.includes(p.display))) return false;
      if (availability.length && !availability.includes(p.availability)) return false;
      if (offer.length && !offer.some((o) => p.offers.includes(o))) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "Price Low to High":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "Price High to Low":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "Popularity":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "Newest":
      case "Latest":
        list = [...list].sort((a, b) => (b.tags.includes("Latest") ? 1 : 0) - (a.tags.includes("Latest") ? 1 : 0));
        break;
      default:
        break;
    }
    return list;
  }, [category, brands, maxPrice, processor, ram, storage, graphics, os, screen, availability, offer, search, sortBy]);

  const resetFilters = () => {
    setCategory(null);
    setBrands([]);
    setMaxPrice(220000);
    setProcessor([]);
    setRam([]);
    setStorage([]);
    setGraphics([]);
    setOs([]);
    setScreen([]);
    setAvailability([]);
    setOffer([]);
    setSearch("");
  };

  const activeFilterCount =
    (category ? 1 : 0) + brands.length + processor.length + ram.length + storage.length + graphics.length + os.length + screen.length + availability.length + offer.length;

  const renderFilters = () => (
    <>
      <div className="filter-panel-top">
        <span className="fp-title">
          <SlidersHorizontal size={16} />
          Filters
        </span>
        {activeFilterCount > 0 && (
          <button type="button" className="fp-clear" onClick={resetFilters}>
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      <FilterSection title="Category" defaultOpen icon={<Layers size={14} />}>
        <div className="cat-filter-list">
          <button type="button" className={`cat-filter-item ${!category ? "active" : ""}`} onClick={() => setCategory(null)}>
            All Categories
          </button>
          {productCategories.map((c) => (
            <button type="button" key={c} className={`cat-filter-item ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brand" defaultOpen icon={<ShieldCheck size={14} />}>
        <div className="pill-wrap">
          {availableBrands.map((b) => (
            <CheckPill key={b} label={b} active={brands.includes(b)} onClick={() => toggle(setBrands, b)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range" defaultOpen icon={<Star size={14} />}>
        <div className="price-slider-wrap">
          <input
            type="range"
            min={1000}
            max={220000}
            step={1000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="price-slider"
          />
          <div className="price-slider-labels">
            <span>₹1,000</span>
            <span className="price-current">Up to ₹{maxPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Specifications" icon={<Cpu size={14} />}>
        <div className="spec-filter-group">
          <span className="sfg-label"><Cpu size={12} /> Processor</span>
          <div className="pill-wrap">
            {filterGroups.processor.map((v) => (
              <CheckPill key={v} label={v} active={processor.includes(v)} onClick={() => toggle(setProcessor, v)} />
            ))}
          </div>
        </div>
        <div className="spec-filter-group">
          <span className="sfg-label"><MemoryStick size={12} /> RAM</span>
          <div className="pill-wrap">
            {filterGroups.ram.map((v) => (
              <CheckPill key={v} label={v} active={ram.includes(v)} onClick={() => toggle(setRam, v)} />
            ))}
          </div>
        </div>
        <div className="spec-filter-group">
          <span className="sfg-label"><HardDrive size={12} /> Storage</span>
          <div className="pill-wrap">
            {filterGroups.storage.map((v) => (
              <CheckPill key={v} label={v} active={storage.includes(v)} onClick={() => toggle(setStorage, v)} />
            ))}
          </div>
        </div>
        <div className="spec-filter-group">
          <span className="sfg-label"><MonitorSmartphone size={12} /> Graphics</span>
          <div className="pill-wrap">
            {filterGroups.graphics.map((v) => (
              <CheckPill key={v} label={v} active={graphics.includes(v)} onClick={() => toggle(setGraphics, v)} />
            ))}
          </div>
        </div>
        <div className="spec-filter-group">
          <span className="sfg-label"><Layers size={12} /> Operating System</span>
          <div className="pill-wrap">
            {filterGroups.os.map((v) => (
              <CheckPill key={v} label={v} active={os.includes(v)} onClick={() => toggle(setOs, v)} />
            ))}
          </div>
        </div>
        <div className="spec-filter-group">
          <span className="sfg-label"><MonitorSmartphone size={12} /> Screen Size</span>
          <div className="pill-wrap">
            {filterGroups.screen.map((v) => (
              <CheckPill key={v} label={v} active={screen.includes(v)} onClick={() => toggle(setScreen, v)} />
            ))}
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Availability" icon={<PackageCheck size={14} />}>
        <div className="pill-wrap">
          {filterGroups.availability.map((v) => (
            <CheckPill key={v} label={v} active={availability.includes(v)} onClick={() => toggle(setAvailability, v)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Offer" icon={<Star size={14} />}>
        <div className="pill-wrap">
          {filterGroups.offer.map((v) => (
            <CheckPill key={v} label={v} active={offer.includes(v)} onClick={() => toggle(setOffer, v)} />
          ))}
        </div>
      </FilterSection>
    </>
  );

  const waLink = (name: string) => `https://wa.me/910000000000?text=${encodeURIComponent(`Hi, I'd like to enquire about the ${name}.`)}`;

  return (
    <section className="products-section" id="products">
      <div className="products-bg">
        <div className="pb-circle pb-circle-a"></div>
        <div className="pb-circle pb-circle-b"></div>
      </div>

      <div className="products-header reveal">
        <span className="section-eyebrow">Product Showcase</span>
        <h2 className="section-title">Premium <span className="grad-text">Product Collection</span></h2>
        <p className="section-subtitle">
          Explore genuine laptops, desktops, workstations, printers, networking products and accessories from globally trusted technology brands.
        </p>
      </div>

      <div className="products-search-wrap reveal">
        <div className="products-search-bar">
          <Search size={18} className="psb-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search laptops, desktops, brands or models..."
          />
          {search && (
            <button type="button" className="psb-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="products-layout">
        <aside className="products-sidebar reveal">
          <div className="filter-panel">{renderFilters()}</div>
        </aside>

        <div className="products-main">
          <div className="products-topbar reveal">
            <span className="pt-count">
              Showing <b>{filtered.length}</b> Product{filtered.length !== 1 ? "s" : ""}
            </span>

            <div className={`sort-select ${isSortOpen ? "open" : ""}`}>
              <button type="button" className="sort-trigger" onClick={() => setIsSortOpen((o) => !o)}>
                Sort By: <b>{sortBy}</b>
                <ChevronDown size={14} />
              </button>
              {isSortOpen && (
                <div className="sort-menu">
                  {sortOptions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`sort-option ${sortBy === s ? "active" : ""}`}
                      onClick={() => {
                        setSortBy(s);
                        setIsSortOpen(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="products-grid">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div className="product-card skeleton-card" key={`sk-${i}`}>
                  <div className="skeleton-img"></div>
                  <div className="skeleton-line w-70"></div>
                  <div className="skeleton-line w-40"></div>
                  <div className="skeleton-line w-90"></div>
                </div>
              ))}

            {!isLoading && filtered.length === 0 && (
              <div className="products-empty">
                <Layers size={34} strokeWidth={1.3} />
                <h4>No products match these filters</h4>
                <p>Try adjusting or resetting your filters to see more products.</p>
                <button type="button" className="fp-clear" onClick={resetFilters}>
                  <RotateCcw size={13} /> Reset Filters
                </button>
              </div>
            )}

            {!isLoading &&
              filtered.map((p, i) => (
                <div className="product-card" key={p.id} style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}>
                  <div className="pc-media">
                    <ProductImage src={p.image} alt={p.name} />
                    <div className="pc-media-sheen"></div>
                    <div className="pc-badges">
                      {[...p.offers, ...p.tags].slice(0, 3).map((t) => (
                        <span className="pc-badge" key={t}>
                          {badgeIcon[t]}
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="pc-brand-chip">{p.brand}</span>
                  </div>

                  <div className="pc-body">
                    <span className="pc-category">{p.category}</span>
                    <h3 className="pc-name">{p.name}</h3>
                    <p className="pc-desc">{p.description}</p>

                    <div className="pc-specs">
                      {p.processor && (
                        <span><Cpu size={12} /> {p.processor}</span>
                      )}
                      {p.ram && (
                        <span><MemoryStick size={12} /> {p.ram}</span>
                      )}
                      {p.storage && (
                        <span><HardDrive size={12} /> {p.storage}</span>
                      )}
                      {p.graphics && (
                        <span><MonitorSmartphone size={12} /> {p.graphics}</span>
                      )}
                      {p.display && (
                        <span><Layers size={12} /> {p.display}</span>
                      )}
                      {p.os && <span><PackageCheck size={12} /> {p.os}</span>}
                    </div>

                    <div className="pc-meta-row">
                      <span className={`pc-avail avail-${p.availability.replace(/\s+/g, "-").toLowerCase()}`}>{p.availability}</span>
                      <span className="pc-warranty"><ShieldCheck size={12} /> {p.warranty}</span>
                    </div>

                    <div className="pc-actions">
                      <button type="button" className="pc-btn pc-btn-ghost" onClick={() => setActiveProduct(p)}>
                        <Eye size={14} /> View Details
                      </button>
                      <a href="#quote" className="pc-btn pc-btn-quote">
                        <FileText size={14} /> Get Quote
                      </a>
                      <a href={waLink(p.name)} target="_blank" rel="noopener noreferrer" className="pc-btn pc-btn-whatsapp">
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Mobile filter FAB */}
      <button type="button" className="mobile-filter-fab" onClick={() => setIsDrawerOpen(true)}>
        <SlidersHorizontal size={16} />
        Filters {activeFilterCount > 0 && <span className="fab-count">{activeFilterCount}</span>}
      </button>

      {/* Mobile filter drawer */}
      <div className={`filter-drawer-overlay ${isDrawerOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setIsDrawerOpen(false)}>
        <div className="filter-drawer">
          <div className="filter-drawer-head">
            <span>Filters</span>
            <button type="button" onClick={() => setIsDrawerOpen(false)} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>
          <div className="filter-drawer-body">{renderFilters()}</div>
          <div className="filter-drawer-footer">
            <button type="button" className="fd-apply" onClick={() => setIsDrawerOpen(false)}>
              Show {filtered.length} Products
            </button>
          </div>
        </div>
      </div>

      {/* Product details modal */}
      {activeProduct && (
        <div className="product-modal-overlay" onClick={(e) => e.target === e.currentTarget && setActiveProduct(null)}>
          <div className="product-modal">
            <button type="button" className="pm-close" onClick={() => setActiveProduct(null)} aria-label="Close">
              <X size={18} />
            </button>
            <div className="pm-media">
              <ProductImage src={activeProduct.image} alt={activeProduct.name} />
            </div>
            <div className="pm-body">
              <span className="pc-category">{activeProduct.category}</span>
              <h3>{activeProduct.name}</h3>
              <p className="pm-desc">{activeProduct.description}</p>

              <div className="pm-badges">
                {[...activeProduct.offers, ...activeProduct.tags].map((t) => (
                  <span className="pc-badge" key={t}>
                    {badgeIcon[t]}
                    {t}
                  </span>
                ))}
              </div>

              <div className="pm-spec-grid">
                {activeProduct.processor && <div><Cpu size={14} /> <b>Processor</b><span>{activeProduct.processor}</span></div>}
                {activeProduct.ram && <div><MemoryStick size={14} /> <b>RAM</b><span>{activeProduct.ram}</span></div>}
                {activeProduct.storage && <div><HardDrive size={14} /> <b>Storage</b><span>{activeProduct.storage}</span></div>}
                {activeProduct.graphics && <div><MonitorSmartphone size={14} /> <b>Graphics</b><span>{activeProduct.graphics}</span></div>}
                {activeProduct.display && <div><Layers size={14} /> <b>Display</b><span>{activeProduct.display}</span></div>}
                {activeProduct.os && <div><PackageCheck size={14} /> <b>OS</b><span>{activeProduct.os}</span></div>}
                <div><ShieldCheck size={14} /> <b>Warranty</b><span>{activeProduct.warranty}</span></div>
                <div><PackageCheck size={14} /> <b>Availability</b><span>{activeProduct.availability}</span></div>
              </div>

              <div className="pc-actions">
                <a href="#quote" className="pc-btn pc-btn-quote">
                  <FileText size={14} /> Get Quote
                </a>
                <a href={waLink(activeProduct.name)} target="_blank" rel="noopener noreferrer" className="pc-btn pc-btn-whatsapp">
                  <MessageCircle size={14} /> WhatsApp Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
