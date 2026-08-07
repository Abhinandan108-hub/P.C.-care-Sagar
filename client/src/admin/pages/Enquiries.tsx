import { useState } from "react";
import toast from "react-hot-toast";
import { Download, MessageSquareText } from "lucide-react";
import SearchBar from "../components/common/SearchBar";
import Pagination from "../components/common/Pagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EnquiryTable from "../components/enquiries/EnquiryTable";
import EnquiryDetailDrawer from "../components/enquiries/EnquiryDetailDrawer";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useEnquiries } from "../hooks/useEnquiries";
import {
  deleteEnquiry,
  getAllEnquiriesForExport,
  markEnquiryAsRead,
} from "../services/enquiryService";
import { exportToCSV } from "../utils/csv";
import { DEFAULT_ENQUIRY_FILTERS } from "../types/enquiry";
import type { Enquiry, EnquiryFilters } from "../types/enquiry";

export default function Enquiries() {
  const [filters, setFilters] = useState<EnquiryFilters>(DEFAULT_ENQUIRY_FILTERS);
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
  const [deletingEnquiry, setDeletingEnquiry] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { enquiries, totalCount, totalPages, loading, error, refetch } = useEnquiries(filters);

  function updateFilters(patch: Partial<EnquiryFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  async function handleMarkRead(enquiry: Enquiry) {
    try {
      await markEnquiryAsRead(enquiry.id);
      toast.success("Marked as Read");
      refetch();
    } catch {
      toast.error("Database Error");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingEnquiry) return;
    setDeleting(true);
    try {
      await deleteEnquiry(deletingEnquiry.id);
      toast.success("Enquiry Deleted Successfully");
      setDeletingEnquiry(null);
      refetch();
    } catch {
      toast.error("Database Error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const rows = await getAllEnquiriesForExport(filters);
      if (rows.length === 0) {
        toast.error("No enquiries to export");
        return;
      }
      exportToCSV(
        `enquiries-${new Date().toISOString().slice(0, 10)}`,
        rows,
        [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "product_name", label: "Product" },
          { key: "message", label: "Message" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Date" },
        ]
      );
      toast.success("Enquiries Exported Successfully");
    } catch {
      toast.error("Export Failed");
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(filters.search || filters.status || filters.dateFrom || filters.dateTo);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Enquiries</h1>
          <p>View and respond to customer enquiries submitted from the website.</p>
        </div>
        <div className="admin-page-head__actions">
          <button
            className="admin-btn admin-btn--ghost"
            style={{ width: "auto" }}
            onClick={handleExportCSV}
            disabled={exporting || totalCount === 0}
          >
            {exporting ? <LoadingSpinner size="sm" /> : <Download size={16} />}
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={filters.search}
          onChange={(search) => updateFilters({ search, page: 1 })}
          placeholder="Search by name, email, phone or message…"
          ariaLabel="Search enquiries"
        />
        <div className="admin-filter-bar">
          <select
            className="admin-select"
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value as EnquiryFilters["status"], page: 1 })}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
          </select>
          <input
            type="date"
            className="admin-select"
            value={filters.dateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value, page: 1 })}
            aria-label="From date"
            style={{ paddingRight: 12 }}
          />
          <input
            type="date"
            className="admin-select"
            value={filters.dateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value, page: 1 })}
            aria-label="To date"
            style={{ paddingRight: 12 }}
          />
          {hasFilters ? (
            <button
              type="button"
              className="admin-filter-chip"
              onClick={() => setFilters((prev) => ({ ...DEFAULT_ENQUIRY_FILTERS, search: prev.search }))}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <LoadingSpinner label="Loading enquiries…" />
        ) : error ? (
          <EmptyState icon={MessageSquareText} title="Couldn't load enquiries" description={error} />
        ) : enquiries.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title={hasFilters ? "No enquiries match your filters" : "No enquiries yet"}
            description={
              hasFilters
                ? "Try adjusting or resetting your search and filters."
                : "Customer enquiries submitted from the website will appear here."
            }
          />
        ) : (
          <>
            <EnquiryTable
              enquiries={enquiries}
              onView={setViewingEnquiry}
              onMarkRead={handleMarkRead}
              onDelete={setDeletingEnquiry}
            />
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={filters.pageSize}
              onPageChange={(page) => updateFilters({ page })}
              itemLabel="enquiries"
            />
          </>
        )}
      </div>

      {viewingEnquiry && (
        <EnquiryDetailDrawer
          enquiry={viewingEnquiry}
          onClose={() => setViewingEnquiry(null)}
        />
      )}

      {deletingEnquiry && (
        <ConfirmDialog
          title="Delete this enquiry?"
          message={`You're about to permanently delete the enquiry from "${deletingEnquiry.name}". This action cannot be undone.`}
          confirmLabel="Delete Enquiry"
          confirmingLabel="Deleting…"
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingEnquiry(null)}
        />
      )}
    </>
  );
}
