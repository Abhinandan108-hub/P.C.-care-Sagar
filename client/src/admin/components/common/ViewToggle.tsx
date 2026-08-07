import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "table" | "cards";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="admin-view-toggle" role="group" aria-label="Switch view">
      <button
        type="button"
        className={`admin-view-toggle__btn ${value === "table" ? "is-active" : ""}`}
        onClick={() => onChange("table")}
        aria-label="Table view"
        title="Table view"
      >
        <List size={15} />
      </button>
      <button
        type="button"
        className={`admin-view-toggle__btn ${value === "cards" ? "is-active" : ""}`}
        onClick={() => onChange("cards")}
        aria-label="Card view"
        title="Card view"
      >
        <LayoutGrid size={15} />
      </button>
    </div>
  );
}
