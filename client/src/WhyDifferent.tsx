import { Store, Sparkles, X, Check, ArrowRight } from "lucide-react";

interface CompareItem {
  bad: string;
  good: string;
}

const compareItems: CompareItem[] = [
  { bad: "Limited Product Options", good: "20+ Global Technology Brands" },
  { bad: "Basic Sales", good: "Complete IT Consultation" },
  { bad: "No Technical Guidance", good: "Expert Product Recommendation" },
  { bad: "Limited After Sales Support", good: "Dedicated Technical Assistance" },
  { bad: "Single Product Sales", good: "Corporate & Government Bulk Solutions" },
  { bad: "No Infrastructure Services", good: "Networking & Complete Office Setup" },
  { bad: "Limited Warranty Support", good: "Genuine Products with Brand Warranty" }
];

export default function WhyDifferent() {
  return (
    <section className="diff-section" id="why-different">
      <div className="diff-bg">
        <div className="dg-circle dg-circle-a"></div>
        <div className="dg-circle dg-circle-b"></div>
        <div className="dg-grid"></div>
      </div>

      <div className="diff-header reveal">
        <span className="section-eyebrow">The P.C. Care Difference</span>
        <h2 className="section-title">
          Why Thousands of Customers <span className="grad-text">Trust P.C. Care</span>
        </h2>
        <p className="section-subtitle">
          We don&rsquo;t just sell products&mdash;we provide complete technology solutions backed by expert guidance
          and reliable after-sales support.
        </p>
      </div>

      {/* ============ SPLIT-SCREEN COMPARISON ============ */}
      <div className="diff-compare-wrap reveal">
        <div className="diff-compare-header">
          <div className="dch-side dch-ordinary">
            <Store size={17} />
            <span>Ordinary Computer Shops</span>
          </div>
          <div className="dch-vs">VS</div>
          <div className="dch-side dch-pccare">
            <Sparkles size={17} />
            <span>P.C. Care Experience</span>
          </div>
        </div>

        <div className="diff-rows">
          {compareItems.map((item, i) => (
            <div className="diff-row reveal" style={{ transitionDelay: `${i * 60}ms` }} key={item.bad}>
              <div className="diff-cell diff-cell-bad">
                <span className="dc-icon dc-icon-bad">
                  <X size={13} strokeWidth={3} />
                </span>
                {item.bad}
              </div>
              <div className="diff-connector">
                <span className="dcn-badge">
                  <ArrowRight size={15} />
                </span>
              </div>
              <div className="diff-cell diff-cell-good">
                <span className="dc-icon dc-icon-good">
                  <Check size={13} strokeWidth={3} />
                </span>
                {item.good}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
