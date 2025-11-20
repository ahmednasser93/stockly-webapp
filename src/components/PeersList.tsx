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
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Peers</h3>
        <p className="text-sm text-gray-500">No peers data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Peers</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {peers.map((peer) => (
            <button
              key={peer.symbol}
              onClick={() => navigate(`/stocks/${peer.symbol}`)}
              className="flex-shrink-0 bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 hover:border-blue-300 transition-colors min-w-[120px]"
            >
              <div className="font-semibold text-gray-900 mb-1">
                {peer.symbol}
              </div>
              <div className="text-sm text-gray-700 mb-1">
                {formatCurrency(peer.price)}
              </div>
              <div
                className={`text-xs font-medium ${
                  peer.changesPercentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatPercentage(peer.changesPercentage)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

