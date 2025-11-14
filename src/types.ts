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

// Alert types
export type AlertDirection = "above" | "below";
export type AlertStatus = "active" | "paused";
export type AlertChannel = "notification";

export interface Alert {
  id: string;
  symbol: string;
  direction: AlertDirection;
  threshold: number;
  status: AlertStatus;
  channel: AlertChannel;
  target: string;
  notes: string | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface CreateAlertRequest {
  symbol: string;
  direction: AlertDirection;
  threshold: number;
  channel: AlertChannel;
  target: string;
  notes?: string;
}

export interface UpdateAlertRequest {
  symbol?: string;
  direction?: AlertDirection;
  threshold?: number;
  status?: AlertStatus;
  channel?: AlertChannel;
  target?: string;
  notes?: string | null;
}

export interface ListAlertsResponse {
  alerts: Alert[];
}

export interface ErrorResponse {
  error: string;
}
