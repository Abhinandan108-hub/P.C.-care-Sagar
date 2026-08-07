import { useState, type FormEvent, type ReactNode } from "react";
import {
  User,
  Phone,
  Mail,
  Tag,
  MessageSquare,
  Send,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Navigation,
  Clock,
  UserRound,
  Loader2,
  Briefcase
} from "lucide-react";

interface FormState {
  fullName: string;
  mobile: string;
  email: string;
  company: string;
  category: string;
  message: string;
  contactMethod: "Phone" | "WhatsApp" | "Email";
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  fullName: "",
  mobile: "",
  email: "",
  company: "",
  category: "",
  message: "",
  contactMethod: "Phone"
};

const categories = [
  "Laptop",
  "Desktop",
  "Printer",
  "Projector",
  "Networking",
  "Accessories",
  "Bulk Order",
  "Government Requirement",
  "Corporate Requirement"
];

const contactMethods: { key: FormState["contactMethod"]; icon: ReactNode }[] = [
  { key: "Phone", icon: <Phone size={14} /> },
  { key: "WhatsApp", icon: <MessageCircle size={14} /> },
  { key: "Email", icon: <Mail size={14} /> }
];

export default function Contact() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = "Please enter your full name";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!form.category) next.category = "Please select a product category";
    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1400);
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitted(false);
  };

  const whatsappHref = () => {
    const lines = [
      "Hi P.C. Care Sagar, I'd like to enquire about a technology solution.",
      form.fullName && `Name: ${form.fullName}`,
      form.category && `Category: ${form.category}`,
      form.company && `Company: ${form.company}`,
      form.message && `Message: ${form.message}`
    ].filter(Boolean);
    return `https://wa.me/919826828666?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-bg">
        <div className="ct-circle ct-circle-a"></div>
        <div className="ct-circle ct-circle-b"></div>
        <div className="ct-grid"></div>
      </div>

      <div className="contact-header reveal">
        <span className="section-eyebrow">Get In Touch</span>
        <h2 className="section-title">
          Let&rsquo;s Build Your Perfect <span className="grad-text">Technology Solution</span>
        </h2>
        <p className="section-subtitle">
          Whether you&rsquo;re an individual customer, a business, a school, or a government department, our experts
          are ready to help you choose the right technology.
        </p>
      </div>

      <div className="contact-grid">
        {/* ============ LEFT: PREMIUM ENQUIRY FORM ============ */}
        <div className="contact-form-wrap reveal">
          <div className="contact-form-card" key={shakeKey}>
            <div className="cfc-glow cfc-glow-a"></div>
            <div className="cfc-glow cfc-glow-b"></div>

            {submitted ? (
              <div className="cfc-success">
                <div className="success-check">
                  <CheckCircle2 size={40} strokeWidth={1.6} />
                </div>
                <h4>Enquiry Sent Successfully!</h4>
                <p>
                  Thank you{form.fullName ? `, ${form.fullName.split(" ")[0]}` : ""}. Our team will get back to you
                  within 24 hours via your preferred contact method.
                </p>
                <button type="button" className="cfc-reset-btn" onClick={resetForm}>
                  Send Another Enquiry
                </button>
              </div>
            ) : (
              <>
                <span className="cfc-eyebrow">Free &amp; No Obligation</span>
                <h3 className="cfc-title">Request a Free Consultation</h3>
                <p className="cfc-sub">Tell us what you need — our specialists will tailor the right solution for you.</p>

                <form className="cfc-form" onSubmit={handleSubmit} noValidate>
                  <div className={`field-group ${errors.fullName ? "has-error" : ""}`}>
                    <span className="field-icon">
                      <User size={17} />
                    </span>
                    <input
                      id="fullName"
                      type="text"
                      placeholder=" "
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                    />
                    <label htmlFor="fullName">Full Name</label>
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>

                  <div className="field-row">
                    <div className={`field-group ${errors.mobile ? "has-error" : ""}`}>
                      <span className="field-icon">
                        <Phone size={16} />
                      </span>
                      <input
                        id="mobile"
                        type="tel"
                        inputMode="numeric"
                        placeholder=" "
                        value={form.mobile}
                        maxLength={10}
                        onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
                      />
                      <label htmlFor="mobile">Mobile Number</label>
                      {errors.mobile && <span className="field-error">{errors.mobile}</span>}
                    </div>

                    <div className={`field-group ${errors.email ? "has-error" : ""}`}>
                      <span className="field-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        id="email"
                        type="email"
                        placeholder=" "
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                      <label htmlFor="email">Email</label>
                      {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="field-group">
                    <span className="field-icon">
                      <Briefcase size={16} />
                    </span>
                    <input
                      id="company"
                      type="text"
                      placeholder=" "
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                    />
                    <label htmlFor="company">Company Name (Optional)</label>
                  </div>

                  <div className={`field-group select-group ${errors.category ? "has-error" : ""}`}>
                    <span className="field-icon">
                      <Tag size={16} />
                    </span>
                    <select
                      id="category"
                      value={form.category}
                      className={form.category ? "has-value" : ""}
                      onChange={(e) => update("category", e.target.value)}
                    >
                      <option value="" disabled></option>
                      {categories.map((c) => (
                        <option value={c} key={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="category">Select Product Category</label>
                    <ChevronDown size={16} className="select-chevron" />
                    {errors.category && <span className="field-error">{errors.category}</span>}
                  </div>

                  <div className="field-group">
                    <span className="field-icon field-icon-top">
                      <MessageSquare size={16} />
                    </span>
                    <textarea
                      id="message"
                      placeholder=" "
                      rows={4}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                    ></textarea>
                    <label htmlFor="message">Message</label>
                  </div>

                  <div className="contact-method-group">
                    <span className="cm-label">Preferred Contact Method</span>
                    <div className="cm-options">
                      {contactMethods.map((m) => (
                        <button
                          type="button"
                          key={m.key}
                          className={`cm-pill ${form.contactMethod === m.key ? "active" : ""}`}
                          onClick={() => update("contactMethod", m.key)}
                        >
                          {m.icon}
                          {m.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cfc-actions">
                    <button type="submit" className="cfc-submit-btn" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 size={17} className="btn-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Enquiry
                          <Send size={16} />
                        </>
                      )}
                    </button>
                    <a
                      href={whatsappHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cfc-whatsapp-btn"
                    >
                      <MessageCircle size={17} />
                      WhatsApp Now
                    </a>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* ============ RIGHT: BRANCH INFO + MAPS ============ */}
        <div className="contact-info-wrap">
          <div className="branch-cards">
            {/* SAGAR BRANCH */}
            <div className="branch-card reveal">
              <div className="branch-card-top">
                <span className="branch-badge">Head Office</span>
                <h4 className="branch-name">
                  <MapPin size={17} />
                  Sagar Branch
                </h4>
              </div>

              <p className="branch-address">
                Near HDFC Bank, Bada Jeena, Parkota Ward,
                <br />
                Sagar, MP &ndash; 470002
              </p>

              <div className="branch-detail-rows">
                <div className="bdr">
                  <Phone size={15} />
                  <div>
                    <a href="tel:+919826828666">9826828666</a>
                    <a href="tel:+917582408666">07582-408666</a>
                  </div>
                </div>
                <div className="bdr">
                  <Mail size={15} />
                  <a href="mailto:pccaresagar@yahoo.com">pccaresagar@yahoo.com</a>
                </div>
                <div className="bdr">
                  <UserRound size={15} />
                  <span>
                    Owner &mdash; <b>Raveendra Jain</b>
                  </span>
                </div>
              </div>

              <div className="branch-actions">
                <a
                  className="branch-btn-primary"
                  href="https://www.google.com/maps/dir/?api=1&destination=Near+HDFC+Bank+Bada+Jeena+Parkota+Ward+Sagar+MP+470002"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation size={14} />
                  Get Directions
                </a>
                <a className="branch-btn-ghost" href="tel:+919826828666">
                  <Phone size={14} />
                  Call Now
                </a>
              </div>
            </div>

            {/* JABALPUR BRANCH */}
            <div className="branch-card reveal" style={{ transitionDelay: "120ms" }}>
              <div className="branch-card-top">
                <span className="branch-badge branch-badge-alt">Branch Office</span>
                <h4 className="branch-name">
                  <MapPin size={17} />
                  Jabalpur Branch
                </h4>
              </div>

              <p className="branch-address">
                Plot No. 265/4, Ambuj Vihar Phase-2,
                <br />
                Napier Town, Jabalpur, MP
              </p>

              <div className="branch-detail-rows">
                <div className="bdr">
                  <Phone size={15} />
                  <a href="tel:+917614900666">0761-4900666</a>
                </div>
                <div className="bdr">
                  <Mail size={15} />
                  <a href="mailto:pccaresagar@yahoo.com">pccaresagar@yahoo.com</a>
                </div>
                <div className="bdr">
                  <UserRound size={15} />
                  <span>
                    Branch Manager &mdash; <b>Sonu Rajput</b> &middot;{" "}
                    <a href="tel:+919826808666">9826808666</a>
                  </span>
                </div>
                <div className="bdr">
                  <UserRound size={15} />
                  <span>
                    Sales &mdash; <b>Aman Jain</b> &middot; <a href="tel:+919826828999">9826828999</a>
                  </span>
                </div>
              </div>

              <div className="branch-actions">
                <a
                  className="branch-btn-primary"
                  href="https://www.google.com/maps/dir/?api=1&destination=Plot+No.+265%2F4+Ambuj+Vihar+Phase-2+Napier+Town+Jabalpur+MP"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation size={14} />
                  Get Directions
                </a>
                <a className="branch-btn-ghost" href="tel:+917614900666">
                  <Phone size={14} />
                  Call Now
                </a>
              </div>
            </div>
          </div>

          {/* GOOGLE MAPS */}
          <div className="contact-map-wrap reveal">
            <div className="map-panel">
              <div className="map-panel-label">
                <MapPin size={13} />
                Sagar Branch
              </div>
              <iframe
                title="P.C. Care Sagar Branch Map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Bada+Jeena+Parkota+Ward+Sagar+MP+470002&output=embed"
              ></iframe>
            </div>
            <div className="map-panel">
              <div className="map-panel-label">
                <MapPin size={13} />
                Jabalpur Branch
              </div>
              <iframe
                title="P.C. Care Jabalpur Branch Map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Ambuj+Vihar+Phase-2+Napier+Town+Jabalpur+MP&output=embed"
              ></iframe>
            </div>
          </div>

          {/* BUSINESS HOURS */}
          <div className="business-hours-card reveal">
            <div className="bh-icon">
              <Clock size={18} />
            </div>
            <div className="bh-rows">
              <div className="bh-row">
                <span>Monday &ndash; Saturday</span>
                <span className="bh-time">10:00 AM &ndash; 8:00 PM</span>
              </div>
              <div className="bh-row">
                <span>Sunday</span>
                <span className="bh-time bh-time-alt">By Appointment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ QUICK CONTACT BAR ============ */}
      <div className="quick-contact-bar reveal">
        <a className="qc-card" href="tel:+919826828666">
          <span className="qc-icon">
            <Phone size={20} />
          </span>
          <span className="qc-text">
            <span className="qc-title">Call Now</span>
            <span className="qc-sub">9826828666</span>
          </span>
        </a>
        <a
          className="qc-card"
          href="https://wa.me/919826828666?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20a%20technology%20solution."
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="qc-icon qc-icon-whatsapp">
            <MessageCircle size={20} />
          </span>
          <span className="qc-text">
            <span className="qc-title">WhatsApp</span>
            <span className="qc-sub">Chat instantly</span>
          </span>
        </a>
        <a className="qc-card" href="mailto:pccaresagar@yahoo.com">
          <span className="qc-icon">
            <Mail size={20} />
          </span>
          <span className="qc-text">
            <span className="qc-title">Email</span>
            <span className="qc-sub">pccaresagar@yahoo.com</span>
          </span>
        </a>
        <a
          className="qc-card"
          href="https://www.google.com/maps/dir/?api=1&destination=Near+HDFC+Bank+Bada+Jeena+Parkota+Ward+Sagar+MP+470002"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="qc-icon">
            <Navigation size={20} />
          </span>
          <span className="qc-text">
            <span className="qc-title">Get Directions</span>
            <span className="qc-sub">Find our showrooms</span>
          </span>
        </a>
      </div>
    </section>
  );
}
