import ReactECharts from "echarts-for-react";
import type { ChartDataPoint, ChartPeriod } from "../types/stockDetails";

interface ChartProps {
  data: ChartDataPoint[];
  period: ChartPeriod;
}

export function Chart({ data, period }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-gray-50 rounded-xl">
        <p className="text-gray-500">No chart data available</p>
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

  return (
    <div className="w-full h-[300px] md:h-[400px] relative">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        className="chart-container"
      />
      <div className="absolute top-2 right-2 text-xs text-gray-500 font-medium">
        {data.length} data points
      </div>
    </div>
  );
}

