import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import type { StockFinancials, FinancialTab } from "../types/stockDetails";
import { FinancialCard } from "./FinancialCard";
import {
  formatCurrency,
  formatLargeNumber,
  formatDate,
} from "../utils/formatters";

interface FinancialsSectionProps {
  financials: StockFinancials;
}

export function FinancialsSection({ financials }: FinancialsSectionProps) {
  const [activeTab, setActiveTab] = useState<FinancialTab>("income");

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200/60 backdrop-blur-sm bg-white/95 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
        <h3 className="text-xl font-bold text-slate-900">Financials</h3>
      </div>

      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as FinancialTab)}
        className="w-full"
      >
        <Tabs.List className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <Tabs.Trigger
            value="income"
            className="px-5 py-2.5 text-sm font-bold text-slate-600 rounded-lg transition-all duration-200 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg hover:text-slate-900 hover:bg-white"
          >
            Income
          </Tabs.Trigger>
          <Tabs.Trigger
            value="keyMetrics"
            className="px-5 py-2.5 text-sm font-bold text-slate-600 rounded-lg transition-all duration-200 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg hover:text-slate-900 hover:bg-white"
          >
            Key Metrics
          </Tabs.Trigger>
          <Tabs.Trigger
            value="ratios"
            className="px-5 py-2.5 text-sm font-bold text-slate-600 rounded-lg transition-all duration-200 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg hover:text-slate-900 hover:bg-white"
          >
            Ratios
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="income" className="mt-4">
          {financials.income && financials.income.length > 0 ? (
            <div className="space-y-4">
              {financials.income.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  <FinancialCard
                    label="Date"
                    value={formatDate(item.date)}
                  />
                  {item.revenue !== undefined && (
                    <FinancialCard
                      label="Revenue"
                      value={formatLargeNumber(item.revenue)}
                    />
                  )}
                  {item.netIncome !== undefined && (
                    <FinancialCard
                      label="Net Income"
                      value={formatLargeNumber(item.netIncome)}
                    />
                  )}
                  {item.eps !== undefined && (
                    <FinancialCard
                      label="EPS"
                      value={formatCurrency(item.eps)}
                    />
                  )}
                  {item.grossProfit !== undefined && (
                    <FinancialCard
                      label="Gross Profit"
                      value={formatLargeNumber(item.grossProfit)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
                }}></div>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-5m-6 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-700 mb-2">Income Data Unavailable</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Financial statements will appear here once available
                </p>
              </div>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="keyMetrics" className="mt-4">
          {financials.keyMetrics ? (
            <div className="grid grid-cols-2 gap-3">
              {financials.keyMetrics.peRatio !== undefined && (
                <FinancialCard
                  label="P/E Ratio"
                  value={financials.keyMetrics.peRatio.toFixed(2)}
                />
              )}
              {financials.keyMetrics.priceToBook !== undefined && (
                <FinancialCard
                  label="Price to Book"
                  value={financials.keyMetrics.priceToBook.toFixed(2)}
                />
              )}
              {financials.keyMetrics.debtToEquity !== undefined && (
                <FinancialCard
                  label="Debt to Equity"
                  value={financials.keyMetrics.debtToEquity.toFixed(2)}
                />
              )}
              {financials.keyMetrics.currentRatio !== undefined && (
                <FinancialCard
                  label="Current Ratio"
                  value={financials.keyMetrics.currentRatio.toFixed(2)}
                />
              )}
              {financials.keyMetrics.roe !== undefined && (
                <FinancialCard
                  label="ROE"
                  value={`${(financials.keyMetrics.roe * 100).toFixed(2)}%`}
                />
              )}
              {financials.keyMetrics.roa !== undefined && (
                <FinancialCard
                  label="ROA"
                  value={`${(financials.keyMetrics.roa * 100).toFixed(2)}%`}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
                }}></div>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-700 mb-2">Key Metrics Unavailable</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Financial metrics will appear here once available
                </p>
              </div>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="ratios" className="mt-4">
          {financials.ratios ? (
            <div className="grid grid-cols-2 gap-3">
              {financials.ratios.currentRatio !== undefined && (
                <FinancialCard
                  label="Current Ratio"
                  value={financials.ratios.currentRatio.toFixed(2)}
                />
              )}
              {financials.ratios.quickRatio !== undefined && (
                <FinancialCard
                  label="Quick Ratio"
                  value={financials.ratios.quickRatio.toFixed(2)}
                />
              )}
              {financials.ratios.debtToEquity !== undefined && (
                <FinancialCard
                  label="Debt to Equity"
                  value={financials.ratios.debtToEquity.toFixed(2)}
                />
              )}
              {financials.ratios.debtToAssets !== undefined && (
                <FinancialCard
                  label="Debt to Assets"
                  value={financials.ratios.debtToAssets.toFixed(2)}
                />
              )}
              {financials.ratios.interestCoverage !== undefined && (
                <FinancialCard
                  label="Interest Coverage"
                  value={financials.ratios.interestCoverage.toFixed(2)}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
                }}></div>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-700 mb-2">Ratios Unavailable</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Financial ratios will appear here once available
                </p>
              </div>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

