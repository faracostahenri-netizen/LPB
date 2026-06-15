import { useEffect, useRef, useState } from "react";

/**
 * Address autocomplete using the official French government BAN (Base Adresse Nationale) API.
 * Endpoint: https://api-adresse.data.gouv.fr/search/?q=...&autocomplete=1&limit=5
 * Public, free, CORS-enabled. Covers all official French addresses.
 */

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Commencez à saisir votre adresse…",
  error,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const lastSelectedRef = useRef("");

  useEffect(() => {
    if (!value || value.trim().length < 3 || value === lastSelectedRef.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          value
        )}&autocomplete=1&limit=6`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features || []);
        setOpen(true);
        setActiveIdx(-1);
      } catch (e) {
        console.error("BAN autocomplete error", e);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (feature) => {
    const p = feature.properties;
    lastSelectedRef.current = p.label;
    onSelect({
      label: p.label,
      street: [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "",
      postcode: p.postcode || "",
      city: p.city || "",
      context: p.context || "",
      latitude: feature.geometry?.coordinates?.[1],
      longitude: feature.geometry?.coordinates?.[0],
    });
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        data-testid="address-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full h-12 rounded-md border bg-white px-4 text-base text-[#0033A0] placeholder-[#7A8294] outline-none transition focus:ring-2 focus:ring-[#0033A0]/30 ${
          error ? "border-[#C8102E]" : "border-[#D7DBE3] focus:border-[#0033A0]"
        }`}
      />
      {loading && (
        <div
          data-testid="address-loading"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A8294]"
        >
          …
        </div>
      )}

      {open && suggestions.length > 0 && (
        <ul
          data-testid="address-suggestions"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-[#D7DBE3] bg-white lbp-shadow-lg"
          role="listbox"
        >
          {suggestions.map((feature, idx) => {
            const p = feature.properties;
            const isActive = idx === activeIdx;
            return (
              <li
                key={p.id || `${p.label}-${idx}`}
                data-testid={`address-option-${idx}`}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(feature);
                }}
                className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                  isActive ? "bg-[#E8F1FB] text-[#0033A0]" : "text-[#0033A0] hover:bg-[#F1F5FA]"
                }`}
              >
                <div className="font-medium">{p.label}</div>
                {p.context && (
                  <div className="text-xs text-[#7A8294]">{p.context}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
