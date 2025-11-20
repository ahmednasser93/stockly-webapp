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
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financials</h3>

      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as FinancialTab)}
        className="w-full"
      >
        <Tabs.List className="flex gap-2 mb-4 border-b border-gray-200">
          <Tabs.Trigger
            value="income"
            className="px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
          >
            Income
          </Tabs.Trigger>
          <Tabs.Trigger
            value="keyMetrics"
            className="px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
          >
            Key Metrics
          </Tabs.Trigger>
          <Tabs.Trigger
            value="ratios"
            className="px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
          >
            Ratios
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="income" className="mt-4">
          {financials.income && financials.income.length > 0 ? (
            <div className="space-y-3">
              {financials.income.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg"
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
            <p className="text-sm text-gray-500 py-4">No income data available</p>
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
            <p className="text-sm text-gray-500 py-4">No key metrics available</p>
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
            <p className="text-sm text-gray-500 py-4">No ratios available</p>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

