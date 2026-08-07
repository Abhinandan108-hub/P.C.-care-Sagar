import { Mail, MessageSquareText, Phone, User } from "lucide-react";
import type { Enquiry } from "../../types/enquiry";

interface EnquiryDetailDrawerProps {
  enquiry: Enquiry;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
});

export default function EnquiryDetailDrawer({ enquiry, onClose }: EnquiryDetailDrawerProps) {
  return (
    <>
      <div className="admin-drawer-overlay" onClick={onClose} />
      <aside className="admin-drawer" role="dialog" aria-modal="true">
        <div className="admin-drawer__head">
          <h3>Enquiry Details</h3>
          <button type="button" className="admin-drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="admin-drawer__body">
          <div className="admin-drawer__section">
            <h4>
              <User size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
              From
            </h4>
            <p style={{ fontWeight: 700, fontSize: 15 }}>{enquiry.name}</p>
            <p style={{ color: "var(--a-muted)", fontSize: 12.5 }}>{dateFormatter.format(new Date(enquiry.created_at))}</p>
          </div>

          <div className="admin-drawer__section">
            <h4>Contact</h4>
            <div className="admin-spec-list">
              <div className="admin-spec-list__item">
                <span className="admin-spec-list__key">
                  <Mail size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
                  Email
                </span>
                <span className="admin-spec-list__value">{enquiry.email || "—"}</span>
              </div>
              <div className="admin-spec-list__item">
                <span className="admin-spec-list__key">
                  <Phone size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
                  Phone
                </span>
                <span className="admin-spec-list__value">{enquiry.phone || "—"}</span>
              </div>
              {enquiry.product_name ? (
                <div className="admin-spec-list__item">
                  <span className="admin-spec-list__key">Product</span>
                  <span className="admin-spec-list__value">{enquiry.product_name}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="admin-drawer__section">
            <h4>
              <MessageSquareText size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
              Message
            </h4>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{enquiry.message}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
