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
import { fetchPublicProducts } from "./api/api";

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
      <button
        type="button"
        className="filter-block-head"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fb-title">
          {icon}
          {title}
        </span>

        <ChevronDown
          className="fb-chev"
          size={16}
        />
      </button>

      <div
        className="filter-block-body"
        style={{
          maxHeight: open ? "5000px" : "0px"
        }}
      >
        <div className="filter-block-inner">
          {children}
        </div>
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

function uniqueBadges(offers: string[], tags: string[], limit?: number) {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const label of [...offers, ...tags]) {
    if (seen.has(label)) continue;
    seen.add(label);
    merged.push(label);
    if (limit !== undefined && merged.length >= limit) break;
  }
  return merged;
}

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
  const [remoteProducts, setRemoteProducts] = useState<Product[] | null>(null);
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

  // fetch products from backend (fallback to local `products` if request fails or DB is empty)
  useEffect(() => {
    let mounted = true;
    const loadProducts = async () => {
      try {
        const items = await fetchPublicProducts();
        if (mounted && items.length > 0) setRemoteProducts(items);
      } catch {
        // network or server error — keep using local data
      }
    };

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

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

  const sourceProducts = remoteProducts ?? products;

  const filtered = useMemo(() => {
    let list = sourceProducts.filter((p) => {
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

    <div className={`sort-select ${isSortOpen ? "open" : ""}`}>
  {!isSortOpen ? (
    <button
      type="button"
      className="sort-trigger"
      onClick={() => setIsSortOpen(true)}
    >
      Sort By: <b>{sortBy}</b>
      <ChevronDown size={14} />
    </button>
  ) : (
    <div
      className="sort-inline"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "nowrap"
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap"
        }}
      >
        Sort by:
      </span>

      <span
        style={{
          fontSize: "10px",
          color: "#9ca3af"
        }}
      >
        •
      </span>

      <button
        type="button"
        className={`sort-option ${
          sortBy === "Price Low to High" ? "active" : ""
        }`}
        onClick={() => {
          setSortBy("Price Low to High");
          setIsSortOpen(false);
        }}
      >
        Price LtoH
      </button>

      <button
        type="button"
        className={`sort-option ${
          sortBy === "Price High to Low" ? "active" : ""
        }`}
        onClick={() => {
          setSortBy("Price High to Low");
          setIsSortOpen(false);
        }}
      >
        Price HtoL
      </button>

      <button
        type="button"
        className={`sort-option ${
          sortBy === "Today's Deal" ? "active" : ""
        }`}
        onClick={() => {
          setSortBy("Today's Deal");
          setIsSortOpen(false);
        }}
      >
        Today's Deal
      </button>
    </div>
  )}
</div>

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
        <button
          type="button"
          className="fp-clear"
          onClick={resetFilters}
        >
          <RotateCcw size={12} />
          Reset
        </button>
      )}
    </div>

    <FilterSection
  title="New Arrival"
  icon={<Sparkles size={14} />}
  defaultOpen
>
  <div className="pill-wrap">
    <CheckPill
      label="Latest Arrival"
      active={offer.includes("Latest Arrival")}
      onClick={() => toggle(setOffer, "Latest Arrival")}
    />

    <CheckPill
      label="New Launch"
      active={offer.includes("New Launch")}
      onClick={() => toggle(setOffer, "New Launch")}
    />

    <CheckPill
      label="Trending Products"
      active={offer.includes("Trending Products")}
      onClick={() => toggle(setOffer, "Trending Products")}
    />

    <CheckPill
      label="Recently Added"
      active={offer.includes("Recently Added")}
      onClick={() => toggle(setOffer, "Recently Added")}
    />

    <CheckPill
      label="This Month Launch"
      active={offer.includes("This Month Launch")}
      onClick={() => toggle(setOffer, "This Month Launch")}
    />
  </div>
</FilterSection>

    <FilterSection
      title="Category"
      icon={<Layers size={14} />}
      defaultOpen
    >
      <div className="cat-filter-list">
        <button
          type="button"
          className={`cat-filter-item ${
            !category ? "active" : ""
          }`}
          onClick={() => setCategory(null)}
        >
          All Categories
        </button>

        {productCategories.map((c) => (
          <button
            type="button"
            key={c}
            className={`cat-filter-item ${
              category === c ? "active" : ""
            }`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </FilterSection>

    <FilterSection
      title="Brand"
      icon={<ShieldCheck size={14} />}
    >
      <div className="pill-wrap">
        {availableBrands.map((b) => (
          <CheckPill
            key={b}
            label={b}
            active={brands.includes(b)}
            onClick={() => toggle(setBrands, b)}
          />
        ))}
      </div>
    </FilterSection>

    <FilterSection
  title="Price"
  icon={<Star size={14} />}
>
  <div className="price-slider-wrap">

    <input
      type="range"
      min={1000}
      max={220000}
      step={1000}
      value={maxPrice}
      onChange={(e) =>
        setMaxPrice(Number(e.target.value))
      }
      className="price-slider"
    />

    <div className="price-slider-labels">
      <span>₹1,000</span>

      <span className="price-current">
        Up to ₹{maxPrice.toLocaleString("en-IN")}
      </span>
    </div>

    <div className="pill-wrap">

      <CheckPill
        label="Under ₹20,000"
        active={maxPrice === 20000}
        onClick={() => setMaxPrice(20000)}
      />

      <CheckPill
        label="₹20,000 - ₹40,000"
        active={maxPrice === 40000}
        onClick={() => setMaxPrice(40000)}
      />

      <CheckPill
        label="₹40,000 - ₹60,000"
        active={maxPrice === 60000}
        onClick={() => setMaxPrice(60000)}
      />

      <CheckPill
        label="₹60,000 - ₹80,000"
        active={maxPrice === 80000}
        onClick={() => setMaxPrice(100000)}
      />
      <CheckPill
        label="₹80,000 - ₹1,00,000"
        active={maxPrice === 100000}
        onClick={() => setMaxPrice(100000)}
      />

      <CheckPill
        label="Above ₹1,00,000"
        active={maxPrice === 220000}
        onClick={() => setMaxPrice(220000)}
      />

    </div>
  </div>
</FilterSection>

    <FilterSection
  title="Specialization"
  icon={<Cpu size={14} />}
>
  {/* Processor */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <Cpu size={12} />
      Processor
    </span>

    <div className="pill-wrap">
      {filterGroups.processor.map((v) => (
        <CheckPill
          key={v}
          label={v}
          active={processor.includes(v)}
          onClick={() => toggle(setProcessor, v)}
        />
      ))}
    </div>
  </div>

  {/* RAM */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <MemoryStick size={12} />
      RAM
    </span>

    <div className="pill-wrap">
      {filterGroups.ram.map((v) => (
        <CheckPill
          key={v}
          label={v}
          active={ram.includes(v)}
          onClick={() => toggle(setRam, v)}
        />
      ))}
    </div>
  </div>

  {/* Storage */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <HardDrive size={12} />
      Storage
    </span>

    <div className="pill-wrap">
      {filterGroups.storage.map((v) => (
        <CheckPill
          key={v}
          label={v}
          active={storage.includes(v)}
          onClick={() => toggle(setStorage, v)}
        />
      ))}
    </div>
  </div>

  {/* Graphics / GPU */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <Cpu size={12} />
      Graphics / GPU
    </span>

    <div className="pill-wrap">
      {filterGroups.graphics.map((v) => (
        <CheckPill
          key={v}
          label={v}
          active={graphics.includes(v)}
          onClick={() => toggle(setGraphics, v)}
        />
      ))}
    </div>
  </div>

  {/* Operating System */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <Cpu size={12} />
      Operating System
    </span>

    <div className="pill-wrap">
      {filterGroups.os.map((v) => (
        <CheckPill
          key={v}
          label={v}
          active={os.includes(v)}
          onClick={() => toggle(setOs, v)}
        />
      ))}
    </div>
  </div>

  {/* Display Size */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <MonitorSmartphone size={12} />
      Display Size
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        11"–13"
      </button>

      <button type="button" className="check-pill">
        14"
      </button>

      <button type="button" className="check-pill">
        15.6"
      </button>

      <button type="button" className="check-pill">
        16"
      </button>

      <button type="button" className="check-pill">
        17"+
      </button>
    </div>
  </div>

  {/* Display Resolution */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <MonitorSmartphone size={12} />
      Display Resolution
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        HD
      </button>

      <button type="button" className="check-pill">
        Full HD
      </button>

      <button type="button" className="check-pill">
        2K
      </button>

      <button type="button" className="check-pill">
        2.5K
      </button>

      <button type="button" className="check-pill">
        4K
      </button>
    </div>
  </div>

  {/* Refresh Rate */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <MonitorSmartphone size={12} />
      Refresh Rate
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        60Hz
      </button>

      <button type="button" className="check-pill">
        90Hz
      </button>

      <button type="button" className="check-pill">
        120Hz
      </button>

      <button type="button" className="check-pill">
        144Hz
      </button>

      <button type="button" className="check-pill">
        165Hz
      </button>

      <button type="button" className="check-pill">
        240Hz+
      </button>
    </div>
  </div>

  {/* Display Type */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      <MonitorSmartphone size={12} />
      Display Type
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        LED
      </button>

      <button type="button" className="check-pill">
        IPS
      </button>

      <button type="button" className="check-pill">
        OLED
      </button>

      <button type="button" className="check-pill">
        AMOLED
      </button>

      <button type="button" className="check-pill">
        Touchscreen
      </button>
    </div>
  </div>

  {/* Connectivity */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Connectivity
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        Wi-Fi
      </button>

      <button type="button" className="check-pill">
        Wi-Fi 6
      </button>

      <button type="button" className="check-pill">
        Wi-Fi 6E
      </button>

      <button type="button" className="check-pill">
        Bluetooth
      </button>

      <button type="button" className="check-pill">
        Ethernet
      </button>

      <button type="button" className="check-pill">
        5G
      </button>
    </div>
  </div>

  {/* Ports */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Ports
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        USB-A
      </button>

      <button type="button" className="check-pill">
        USB-C
      </button>

      <button type="button" className="check-pill">
        Thunderbolt
      </button>

      <button type="button" className="check-pill">
        HDMI
      </button>

      <button type="button" className="check-pill">
        DisplayPort
      </button>

      <button type="button" className="check-pill">
        Ethernet
      </button>

      <button type="button" className="check-pill">
        Audio Jack
      </button>

      <button type="button" className="check-pill">
        SD Card Reader
      </button>
    </div>
  </div>

  {/* Keyboard */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Keyboard
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        Backlit Keyboard
      </button>

      <button type="button" className="check-pill">
        RGB Keyboard
      </button>

      <button type="button" className="check-pill">
        Numeric Keypad
      </button>

      <button type="button" className="check-pill">
        Spill Resistant
      </button>
    </div>
  </div>

  {/* Camera */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Camera
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        HD Webcam
      </button>

      <button type="button" className="check-pill">
        Full HD Webcam
      </button>

      <button type="button" className="check-pill">
        IR Camera
      </button>

      <button type="button" className="check-pill">
        Privacy Shutter
      </button>
    </div>
  </div>

  {/* Security */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Security
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        Fingerprint
      </button>

      <button type="button" className="check-pill">
        Face Unlock
      </button>

      <button type="button" className="check-pill">
        TPM
      </button>

      <button type="button" className="check-pill">
        Privacy Shutter
      </button>

      <button type="button" className="check-pill">
        Kensington Lock
      </button>
    </div>
  </div>

  {/* Battery */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Battery
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        Up to 4 Hours
      </button>

      <button type="button" className="check-pill">
        4–6 Hours
      </button>

      <button type="button" className="check-pill">
        6–8 Hours
      </button>

      <button type="button" className="check-pill">
        8–12 Hours
      </button>

      <button type="button" className="check-pill">
        12+ Hours
      </button>
    </div>
  </div>

  {/* Form Factor */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Form Factor
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        Standard Laptop
      </button>

      <button type="button" className="check-pill">
        Thin & Light
      </button>

      <button type="button" className="check-pill">
        2-in-1
      </button>

      <button type="button" className="check-pill">
        Convertible
      </button>

      <button type="button" className="check-pill">
        Workstation
      </button>

      <button type="button" className="check-pill">
        Mini PC
      </button>

      <button type="button" className="check-pill">
        Desktop Tower
      </button>

      <button type="button" className="check-pill">
        All-in-One
      </button>
    </div>
  </div>

  {/* Weight */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Weight
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        Under 1.5 kg
      </button>

      <button type="button" className="check-pill">
        1.5–2 kg
      </button>

      <button type="button" className="check-pill">
        2–2.5 kg
      </button>

      <button type="button" className="check-pill">
        Above 2.5 kg
      </button>
    </div>
  </div>

  {/* Warranty */}
  <div className="spec-filter-group">
    <span className="sfg-label">
      Warranty
    </span>

    <div className="pill-wrap">
      <button type="button" className="check-pill">
        1 Year
      </button>

      <button type="button" className="check-pill">
        2 Years
      </button>

      <button type="button" className="check-pill">
        3 Years
      </button>

      <button type="button" className="check-pill">
        Extended Warranty
      </button>
    </div>
  </div>
</FilterSection>

    <FilterSection
  title="Rating"
  icon={<Star size={14} />}
>
  <div className="pill-wrap">
    <button type="button" className="check-pill">
      ★ 5 Star
    </button>

    <button type="button" className="check-pill">
      ★ 4.5 & Above
    </button>

    <button type="button" className="check-pill">
      ★ 4.0 & Above
    </button>

    <button type="button" className="check-pill">
      ★ 3.0 & Above
    </button>

    <button type="button" className="check-pill">
      Top Rated
    </button>

    <button type="button" className="check-pill">
      Most Reviewed
    </button>
  </div>
</FilterSection>

    <FilterSection
  title="Offers & Discounts"
  icon={<Star size={14} />}
>
  <div className="pill-wrap">
    <CheckPill
      label="Today's Deal"
      active={offer.includes("Today's Deal")}
      onClick={() => toggle(setOffer, "Today's Deal")}
    />

    <CheckPill
      label="Special Offer"
      active={offer.includes("Special Offer")}
      onClick={() => toggle(setOffer, "Special Offer")}
    />

    <CheckPill
      label="Best Seller"
      active={offer.includes("Best Seller")}
      onClick={() => toggle(setOffer, "Best Seller")}
    />

    <CheckPill
      label="Festival Offer"
      active={offer.includes("Festival Offer")}
      onClick={() => toggle(setOffer, "Festival Offer")}
    />

    <CheckPill
      label="Cashback Available"
      active={offer.includes("Cashback Available")}
      onClick={() => toggle(setOffer, "Cashback Available")}
    />

    <CheckPill
      label="Exchange Offer"
      active={offer.includes("Exchange Offer")}
      onClick={() => toggle(setOffer, "Exchange Offer")}
    />

    <CheckPill
      label="No Cost EMI"
      active={offer.includes("No Cost EMI")}
      onClick={() => toggle(setOffer, "No Cost EMI")}
    />
  </div>
</FilterSection>

    <FilterSection
  title="Payment Mode"
  icon={<FileText size={14} />}
>
  <div className="pill-wrap">
    <button type="button" className="check-pill">
      Cash
    </button>

    <button type="button" className="check-pill">
      UPI
    </button>

    <button type="button" className="check-pill">
      Credit Card
    </button>

    <button type="button" className="check-pill">
      Debit Card
    </button>

    <button type="button" className="check-pill">
      EMI
    </button>

    <button type="button" className="check-pill">
      Net Banking
    </button>

    <button type="button" className="check-pill">
      Pay Later
    </button>
  </div>
</FilterSection>

    <FilterSection
  title="Usage"
  icon={<MonitorSmartphone size={14} />}
>
  <div className="pill-wrap">
    <button type="button" className="check-pill">
      Home
    </button>

    <button type="button" className="check-pill">
      Office
    </button>

    <button type="button" className="check-pill">
      Business
    </button>

    <button type="button" className="check-pill">
      Gaming
    </button>

    <button type="button" className="check-pill">
      Student
    </button>

    <button type="button" className="check-pill">
      Professional
    </button>

    <button type="button" className="check-pill">
      Enterprise
    </button>
  </div>
</FilterSection>
  </>
);

  const waLink = (name: string) => `https://wa.me/919826828666?text=${encodeURIComponent(`Hi, I'd like to enquire about the ${name}.`)}`;

  return (
    <section className="products-section" id="products">
      <div className="products-bg">
        <div className="pb-circle pb-circle-a"></div>
        <div className="pb-circle pb-circle-b"></div>
      </div>

      <div className="products-header reveal">
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

  {!isSortOpen ? (
    <button
      type="button"
      className="sort-trigger"
      onClick={() => setIsSortOpen(true)}
    >
      Sort By: <b>{sortBy}</b>
      <ChevronDown size={14} />
    </button>
  ) : (
    <div className="sort-menu">

      <span className="sort-label">
        Sort by:
      </span>

      <span className="sort-dot">
        •
      </span>
      
      <button
  type="button"
  className={`sort-option ${
    sortBy === "Latest" ? "active" : ""
  }`}
  onClick={() => {
    setSortBy("Latest");
    setIsSortOpen(false);
  }}
>
  Latest
</button>

<button
  type="button"
  className={`sort-option ${
    sortBy === "Popularity" ? "active" : ""
  }`}
  onClick={() => {
    setSortBy("Popularity");
    setIsSortOpen(false);
  }}
>
  Popular
</button>

      <button
        type="button"
        className={`sort-option ${
          sortBy === "Price Low to High" ? "active" : ""
        }`}
        onClick={() => {
          setSortBy("Price Low to High");
          setIsSortOpen(false);
        }}
      >
        Price Low - High
      </button>

      <button
        type="button"
        className={`sort-option ${
          sortBy === "Price High to Low" ? "active" : ""
        }`}
        onClick={() => {
          setSortBy("Price High to Low");
          setIsSortOpen(false);
        }}
      >
        Price High - Low
      </button>

      <button
        type="button"
        className={`sort-option ${
          sortBy === "Today's Deal" ? "active" : ""
        }`}
        onClick={() => {
          setSortBy("Today's Deal");
          setIsSortOpen(false);
        }}
      >
        Today's Deal
      </button>

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
                      {uniqueBadges(p.offers, p.tags, 3).map((t) => (
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
                {uniqueBadges(activeProduct.offers, activeProduct.tags).map((t) => (
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
