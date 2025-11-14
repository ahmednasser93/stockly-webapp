export type SearchResult = {
  symbol: string;
  name: string;
  currency?: string;
  stockExchange?: string;
};

export type StockQuote = {
  symbol: string;
  price: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  volume: number | null;
  timestamp: number | null;
};
