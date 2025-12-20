import { API_BASE_URL } from "./client";

export interface FavoriteStock {
  symbol: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteStocksResponse {
  stocks: FavoriteStock[];
}

export interface UpdateFavoriteStocksRequest {
  symbols: string[];
}

export interface UpdateFavoriteStocksResponse {
  success: boolean;
  message: string;
  stocks: FavoriteStock[];
}

/**
 * Fetch user's favorite stocks from the API
 */
export async function getFavoriteStocks(): Promise<FavoriteStock[]> {
  const response = await fetch(`${API_BASE_URL}/v1/api/favorite-stocks`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Not authenticated - return empty array (user not logged in)
      return [];
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch favorite stocks: ${errorText}`);
  }

  const data: FavoriteStocksResponse = await response.json();
  return data.stocks || [];
}

/**
 * Update user's favorite stocks
 */
export async function updateFavoriteStocks(
  symbols: string[]
): Promise<UpdateFavoriteStocksResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/api/favorite-stocks`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symbols }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update favorite stocks: ${errorText}`);
  }

  return (await response.json()) as UpdateFavoriteStocksResponse;
}

/**
 * Delete a favorite stock
 */
export async function deleteFavoriteStock(symbol: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/v1/api/favorite-stocks/${encodeURIComponent(symbol)}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete favorite stock: ${errorText}`);
  }
}






