import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  ariaLabel?: string;
}

/** Instant-feeling search: local state updates immediately, parent state
 * (which triggers the Supabase query) updates after a short debounce. */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs = 300,
  ariaLabel = "Search",
}: SearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="admin-search">
      <Search />
      <input
        type="text"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        aria-label={ariaLabel}
      />
      {local ? (
        <button
          type="button"
          className="admin-search__clear"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}
