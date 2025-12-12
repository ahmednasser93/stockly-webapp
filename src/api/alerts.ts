import type {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  ListAlertsResponse,
  ErrorResponse,
} from "../types";

import { API_BASE_URL } from "./client";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorData = (await res.json()) as ErrorResponse;
      errorMessage = errorData.error || `Request failed with ${res.status}`;
    } catch {
      errorMessage = await res.text();
    }
    throw new Error(errorMessage || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listAlerts(): Promise<Alert[]> {
  const url = `${API_BASE_URL}/v1/api/alerts`;
  const res = await fetch(url, { credentials: "include" });
  const data = await handleResponse<ListAlertsResponse>(res);
  return data.alerts ?? [];
}

export async function getAlert(id: string): Promise<Alert> {
  const url = `${API_BASE_URL}/v1/api/alerts/${id}`;
  const res = await fetch(url, { credentials: "include" });
  return handleResponse<Alert>(res);
}

export async function createAlert(
  data: CreateAlertRequest
): Promise<Alert> {
  const url = `${API_BASE_URL}/v1/api/alerts`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse<Alert>(res);
}

export async function updateAlert(
  id: string,
  data: UpdateAlertRequest
): Promise<Alert> {
  const url = `${API_BASE_URL}/v1/api/alerts/${id}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse<Alert>(res);
}

export async function deleteAlert(id: string): Promise<{ success: boolean }> {
  const url = `${API_BASE_URL}/v1/api/alerts/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<{ success: boolean }>(res);
}

