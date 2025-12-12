import ReactECharts from "echarts-for-react";
import type { ChartDataPoint, ChartPeriod } from "../types/stockDetails";
import { Activity } from "lucide-react";

interface ChartProps {
  data: ChartDataPoint[];
  period: ChartPeriod;
}

export function Chart({ data, period }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] md:h-[400px] relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
            animation: 'slide 20s linear infinite'
          }}></div>
        </div>

        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3 animate-pulse">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-slate-600">Loading chart data...</p>
        </div>

        <style>{`
          @keyframes slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(20px); }
          }
        `}</style>
      </div>
    );
  }

  const formatXAxisLabel = (dateString: string): string => {
    const date = new Date(dateString);
    if (period === "1D") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (period === "1W") {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
      });
    }
    if (period === "1M") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: period === "ALL" ? "numeric" : undefined,
    });
  };

  const option = {
    grid: {
      left: "10%",
      right: "10%",
      top: "10%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((point) => formatXAxisLabel(point.date)),
      axisLabel: {
        fontSize: 10,
        rotate: period === "ALL" ? 45 : 0,
        color: "#6B7280",
      },
      axisLine: {
        lineStyle: {
          color: "#E5E7EB",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => `$${value.toFixed(2)}`,
        fontSize: 10,
        color: "#6B7280",
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#E5E7EB",
          type: "dashed",
        },
      },
      axisLine: {
        show: false,
      },
    },
    series: [
      {
        type: "line",
        data: data.map((point) => point.price),
        smooth: true,
        lineStyle: {
          color: "#2563EB",
          width: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(37, 99, 235, 0.3)" },
              { offset: 1, color: "rgba(37, 99, 235, 0.0)" },
            ],
          },
        },
        symbol: "none",
        emphasis: {
          focus: "series",
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      textStyle: {
        color: "#1F2937",
        fontSize: 12,
      },
      formatter: (params: Array<{ dataIndex: number; value: number }> | null) => {
        if (!params || params.length === 0) return "";
        const point = data[params[0].dataIndex];
        const date = new Date(point.date);
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
              $${params[0].value.toFixed(2)}
            </div>
            <div style="font-size: 12px; color: #6B7280;">
              ${date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
            </div>
          </div>
        `;
      },
    },
  };

  // Calculate price change for gradient color
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const isPositive = lastPrice >= firstPrice;
  const chartColor = isPositive ? "#10b981" : "#ef4444"; // green or red
  const chartGradientStart = isPositive
    ? "rgba(16, 185, 129, 0.4)"
    : "rgba(239, 68, 68, 0.4)";
  const chartGradientEnd = isPositive
    ? "rgba(16, 185, 129, 0.0)"
    : "rgba(239, 68, 68, 0.0)";

  // Update option with dynamic colors
  const enhancedOption = {
    ...option,
    series: [
      {
        ...option.series[0],
        lineStyle: {
          color: chartColor,
          width: 3,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: chartGradientStart },
              { offset: 1, color: chartGradientEnd },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="w-full h-[300px] md:h-[450px] relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-xl pointer-events-none z-10"></div>
      <ReactECharts
        option={enhancedOption}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        className="chart-container transition-transform duration-300 group-hover:scale-[1.01]"
      />
      <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200/60 text-xs font-semibold text-slate-600 z-20">
        {data.length} points
      </div>
    </div>
  );
}

