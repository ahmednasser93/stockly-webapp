import ReactECharts from "echarts-for-react";
import type { ChartDataPoint } from "../types/stockDetails";

interface CandlestickChartProps {
    data: ChartDataPoint[];
}

export function CandlestickChart({ data }: CandlestickChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-500">No chart data available</p>
            </div>
        );
    }

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
            data: data.map((point) => {
                const date = new Date(point.date);
                return date.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                });
            }),
            axisLabel: {
                fontSize: 10,
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
            scale: true,
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
                type: "candlestick",
                data: data.map((point) => [
                    point.open,
                    point.close,
                    point.low,
                    point.high,
                ]),
                itemStyle: {
                    color: "#13C38B", // Bullish (green)
                    color0: "#FF5B5B", // Bearish (red)
                    borderColor: "#13C38B",
                    borderColor0: "#FF5B5B",
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
            formatter: (params: any) => {
                if (!params || params.length === 0) return "";
                const param = params[0];
                const point = data[param.dataIndex];
                const date = new Date(point.date);

                // param.data is [open, close, low, high]
                const open = param.data[1];
                const close = param.data[2];
                const low = param.data[3];
                const high = param.data[4];

                return `
          <div style="padding: 8px;">
            <div style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">
              ${date.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                })}
            </div>
            <div style="font-weight: 600; font-size: 13px;">
              Open: $${open.toFixed(2)}<br/>
              High: $${high.toFixed(2)}<br/>
              Low: $${low.toFixed(2)}<br/>
              Close: $${close.toFixed(2)}
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
                {data.length} candles (4h)
            </div>
        </div>
    );
}
