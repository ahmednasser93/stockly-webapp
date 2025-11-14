interface Props {
  symbols: string[];
  onRemove: (symbol: string) => void;
}

export function TrackedSymbols({ symbols, onRemove }: Props) {
  if (!symbols.length) return null;
  return (
    <div className="tracked-symbols">
      {symbols.map((symbol) => (
        <span key={symbol} className="chip">
          {symbol}
          <button type="button" onClick={() => onRemove(symbol)}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
