import { Eye, Mail, MailOpen, Trash2 } from "lucide-react";
import type { Enquiry } from "../../types/enquiry";

interface EnquiryTableProps {
  enquiries: Enquiry[];
  onView: (enquiry: Enquiry) => void;
  onMarkRead: (enquiry: Enquiry) => void;
  onDelete: (enquiry: Enquiry) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function EnquiryTable({ enquiries, onView, onMarkRead, onDelete }: EnquiryTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Message</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((enquiry) => (
            <tr key={enquiry.id} style={enquiry.status === "new" ? { background: "var(--a-accent-soft)" } : undefined}>
              <td>
                {enquiry.status === "new" ? (
                  <span className="admin-badge admin-badge--blue admin-badge--dot">New</span>
                ) : (
                  <span className="admin-badge admin-badge--gray admin-badge--dot">Read</span>
                )}
              </td>
              <td>
                <div className="admin-table__name" title={enquiry.name}>
                  {enquiry.name}
                </div>
                {enquiry.product_name ? (
                  <div style={{ fontSize: 11.5, color: "var(--a-muted)" }}>Re: {enquiry.product_name}</div>
                ) : null}
              </td>
              <td>
                <div style={{ fontSize: 12.5 }}>{enquiry.email || "—"}</div>
                <div style={{ fontSize: 12.5, color: "var(--a-muted)" }}>{enquiry.phone || "—"}</div>
              </td>
              <td>
                <div className="admin-table__name" style={{ maxWidth: 260 }} title={enquiry.message}>
                  {enquiry.message}
                </div>
              </td>
              <td style={{ whiteSpace: "nowrap", color: "var(--a-muted)", fontSize: 12.5 }}>
                {dateFormatter.format(new Date(enquiry.created_at))}
              </td>
              <td>
                <div className="admin-table__actions">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => onView(enquiry)}
                    aria-label={`View enquiry from ${enquiry.name}`}
                    title="View"
                  >
                    <Eye size={15} />
                  </button>
                  {enquiry.status === "new" ? (
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => onMarkRead(enquiry)}
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <MailOpen size={15} />
                    </button>
                  ) : (
                    <span className="admin-action-btn" style={{ opacity: 0.35, cursor: "default" }} title="Already read">
                      <Mail size={15} />
                    </span>
                  )}
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--danger"
                    onClick={() => onDelete(enquiry)}
                    aria-label={`Delete enquiry from ${enquiry.name}`}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
