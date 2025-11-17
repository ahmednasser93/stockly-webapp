import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchSymbols } from "../api/client";
import type {
  Alert,
  AlertDirection,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertStatus,
} from "../types";

interface AlertFormProps {
  alert?: Alert | null;
  onSubmit: (data: CreateAlertRequest | UpdateAlertRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AlertForm({
  alert,
  onSubmit,
  onCancel,
  isSubmitting,
}: AlertFormProps) {
  const [symbol, setSymbol] = useState(alert?.symbol ?? "");
  const [direction, setDirection] = useState<AlertDirection>(
    alert?.direction ?? "above"
  );
  const [threshold, setThreshold] = useState(
    alert?.threshold?.toString() ?? ""
  );
  const [status, setStatus] = useState<AlertStatus>(alert?.status ?? "active");
  const [target, setTarget] = useState(alert?.target ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["search", symbol],
    queryFn: () => searchSymbols(symbol.trim()),
    enabled: symbol.trim().length >= 2 && !alert,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (alert) {
      setSymbol(alert.symbol);
      setDirection(alert.direction);
      setThreshold(alert.threshold.toString());
      setStatus(alert.status);
      setTarget(alert.target);
    }
  }, [alert]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    }

    const thresholdNum = parseFloat(threshold);
    if (!threshold || isNaN(thresholdNum) || thresholdNum <= 0) {
      newErrors.threshold = "Must be a positive number";
    }

    if (!target.trim()) {
      newErrors.target = "FCM Token is required";
    } else if (target.length < 50 || !/^[A-Za-z0-9_-]+$/.test(target)) {
      newErrors.target = "Invalid FCM token format (must be at least 50 alphanumeric characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const data: CreateAlertRequest | UpdateAlertRequest = alert
        ? {
            symbol: symbol.toUpperCase(),
            direction,
            threshold: parseFloat(threshold),
            status,
            channel: "notification", // Always use notification channel
            target,
          }
        : {
            symbol: symbol.toUpperCase(),
            direction,
            threshold: parseFloat(threshold),
            channel: "notification", // Always use notification channel
            target,
          };

      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleSelectSuggestion = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setShowSuggestions(false);
  };

  return (
    <div className="alert-form-overlay" onClick={onCancel}>
      <div className="alert-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-form-header">
          <h2>{alert ? "Edit Alert" : "Create Alert"}</h2>
          <button
            type="button"
            className="ghost close-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="alert-form">
          <div className="form-group">
            <label htmlFor="symbol">
              Stock Symbol <span className="required">*</span>
            </label>
            <div className="autocomplete-wrapper">
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value.toUpperCase());
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g., AAPL"
                disabled={isSubmitting || !!alert}
                className={errors.symbol ? "error" : ""}
              />
              {errors.symbol && (
                <span className="error-message">{errors.symbol}</span>
              )}
              {showSuggestions &&
                !alert &&
                searchQuery.data &&
                searchQuery.data.length > 0 && (
                  <ul className="suggestions">
                    {searchQuery.data.slice(0, 5).map((result) => (
                      <li key={result.symbol}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(result.symbol)}
                        >
                          <span>{result.symbol}</span>
                          <small>{result.name}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="direction">
                Direction <span className="required">*</span>
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="direction"
                    value="above"
                    checked={direction === "above"}
                    onChange={(e) =>
                      setDirection(e.target.value as AlertDirection)
                    }
                    disabled={isSubmitting}
                  />
                  <span>↑ Above</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="direction"
                    value="below"
                    checked={direction === "below"}
                    onChange={(e) =>
                      setDirection(e.target.value as AlertDirection)
                    }
                    disabled={isSubmitting}
                  />
                  <span>↓ Below</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="threshold">
                Threshold Price <span className="required">*</span>
              </label>
              <input
                id="threshold"
                type="number"
                step="0.01"
                min="0.01"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g., 200.50"
                disabled={isSubmitting}
                className={errors.threshold ? "error" : ""}
              />
              {errors.threshold && (
                <span className="error-message">{errors.threshold}</span>
              )}
            </div>
          </div>

          {alert && (
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === "active"}
                    onChange={(e) => setStatus(e.target.value as AlertStatus)}
                    disabled={isSubmitting}
                  />
                  <span>🟢 Active</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="paused"
                    checked={status === "paused"}
                    onChange={(e) => setStatus(e.target.value as AlertStatus)}
                    disabled={isSubmitting}
                  />
                  <span>⏸️ Paused</span>
                </label>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="channel">
              Notification Channel <span className="required">*</span>
            </label>
            <div className="channel-buttons-group">
              <button
                type="button"
                className="channel-button active"
                disabled={false}
              >
                📱 Mobile Notification
              </button>
              <button
                type="button"
                className="channel-button disabled"
                disabled={true}
                title="Email notifications are not available. Use mobile app for push notifications."
              >
                📧 Email (Disabled)
              </button>
              <button
                type="button"
                className="channel-button disabled"
                disabled={true}
                title="Webhook notifications are not available. Use mobile app for push notifications."
              >
                🔗 Webhook (Disabled)
              </button>
            </div>
            <p className="help-text">
              Alerts are sent via Firebase Cloud Messaging (FCM) to mobile devices.
              Email and Webhook channels are legacy and no longer supported.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="target">
              FCM Token (Notification Target) <span className="required">*</span>
            </label>
            <input
              id="target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter FCM token from mobile app"
              disabled={isSubmitting}
              readOnly={false}
              className={errors.target ? "error" : ""}
            />
            <p className="help-text">
              The FCM token is used to send push notifications to your device. Get this token from the Stockly mobile app, or create alerts directly from the mobile app where it's automatically managed.
            </p>
            {errors.target && (
              <span className="error-message">{errors.target}</span>
            )}
          </div>


          <div className="form-actions">
            <button
              type="button"
              className="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : alert
                  ? "Update Alert"
                  : "Create Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

