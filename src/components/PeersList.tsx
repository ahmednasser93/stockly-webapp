import { useNavigate } from "react-router-dom";
import type { StockPeer } from "../types/stockDetails";
import { formatCurrency, formatPercentage } from "../utils/formatters";

interface PeersListProps {
  peers: StockPeer[];
}

export function PeersList({ peers }: PeersListProps) {
  const navigate = useNavigate();

  if (!peers || peers.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 rounded-full shadow-lg"></div>
          <h3 className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Peers</h3>
        </div>
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)`,
            }}></div>
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-700 mb-2">No Peers Available</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Similar companies will appear here once available
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 rounded-full shadow-lg"></div>
        <h3 className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Peers</h3>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4">
          {peers.map((peer) => {
            const isPositive = peer.changesPercentage >= 0;
            return (
              <button
                key={peer.symbol}
                onClick={() => navigate(`/stocks/${peer.symbol}`)}
                className="group flex-shrink-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 border-2 border-slate-200 shadow-lg hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 min-w-[140px] text-left"
              >
                <div className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {peer.symbol}
                </div>
                <div className="text-base font-bold text-slate-700 mb-2">
                  {formatCurrency(peer.price)}
                </div>
                <div
                  className={`text-sm font-bold px-2 py-1 rounded-lg inline-block ${
                    isPositive
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {formatPercentage(peer.changesPercentage)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

