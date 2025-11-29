export type StockDetails = {
  symbol: string;
  profile: StockProfile;
  quote: StockQuote;
  chart: StockChart;
  financials: StockFinancials;
  news: StockNews[];
  peers: StockPeer[];
};

export type StockProfile = {
  companyName: string;
  industry?: string;
  sector?: string;
  description?: string;
  website?: string;
  image?: string;
};

export type StockQuote = {
  price: number;
  change: number;
  changesPercentage: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
};

export type StockChart = {
  "1D": ChartDataPoint[];
  "1W": ChartDataPoint[];
  "1M": ChartDataPoint[];
  "3M": ChartDataPoint[];
  "1Y": ChartDataPoint[];
  "ALL": ChartDataPoint[];
};

export type ChartDataPoint = {
  date: string; // ISO 8601
  price: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

export type StockFinancials = {
  income: IncomeStatement[];
  keyMetrics?: KeyMetrics;
  ratios?: Ratios;
};

export type IncomeStatement = {
  date: string; // YYYY-MM-DD
  revenue?: number;
  netIncome?: number;
  eps?: number;
  grossProfit?: number;
};

export type KeyMetrics = {
  peRatio?: number;
  priceToBook?: number;
  debtToEquity?: number;
  currentRatio?: number;
  roe?: number;
  roa?: number;
};

export type Ratios = {
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  debtToAssets?: number;
  interestCoverage?: number;
};

export type StockNews = {
  title: string;
  source: string;
  publishedDate: string; // ISO 8601
  url: string;
  image?: string;
  summary?: string;
};

export type StockPeer = {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
};

// Chart period type
export type ChartPeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

// Financial tab type
export type FinancialTab = "income" | "keyMetrics" | "ratios";

