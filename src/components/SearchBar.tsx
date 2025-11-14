import type { SearchResult } from "../types";

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  suggestions: SearchResult[];
  onSelectSuggestion: (symbol: string) => void;
  loading?: boolean;
}

export function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  suggestions,
  onSelectSuggestion,
  loading,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <div className="field-group">
        <input
          type="text"
          value={query}
          placeholder="Search for a stock symbol or company"
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <button type="button" onClick={onSubmit} disabled={!query.trim()}>
          Add
        </button>
      </div>
      {loading && <div className="muted">Searching…</div>}
      {!loading && suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.symbol}>
              <button
                type="button"
                onClick={() => onSelectSuggestion(suggestion.symbol)}
              >
                <span>{suggestion.symbol}</span>
                <small>
                  {suggestion.name}
                  {suggestion.stockExchange ? ` • ${suggestion.stockExchange}` : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
