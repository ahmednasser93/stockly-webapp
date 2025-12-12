import ReactECharts from "echarts-for-react";
import type { ChartDataPoint } from "../types/stockDetails";

interface CandlestickChartProps {
    data: ChartDataPoint[];
}

export function CandlestickChart({ data }: CandlestickChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] md:h-[450px] relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
                        animation: 'slide 20s linear infinite'
                    }}></div>
                </div>
                
                <div className="relative z-10 text-center px-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4 animate-pulse">
                        <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Candlestick Data Loading</h3>
                    <p className="text-sm text-slate-500 max-w-xs">
                        OHLC price data will appear here once available
                    </p>
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
