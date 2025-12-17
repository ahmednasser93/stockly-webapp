import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "../state/SettingsContext";
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
  // Initialize state from alert prop, reset when alert changes
  const getInitialSymbol = () => alert?.symbol ?? "";
  const getInitialDirection = (): AlertDirection => alert?.direction ?? "above";
  const getInitialThreshold = () => alert?.threshold?.toString() ?? "";
  const getInitialStatus = (): AlertStatus => alert?.status ?? "active";

  const [symbol, setSymbol] = useState(getInitialSymbol);
  const [direction, setDirection] = useState<AlertDirection>(getInitialDirection);
  const [threshold, setThreshold] = useState(getInitialThreshold);
  const [status, setStatus] = useState<AlertStatus>(getInitialStatus);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { cacheStaleTimeMinutes } = useSettings();

  const searchQuery = useQuery({
    queryKey: ["search", symbol],
    queryFn: () => searchSymbols(symbol.trim()),
    enabled: symbol.trim().length >= 2 && !alert,
    staleTime: cacheStaleTimeMinutes * 60 * 1000,
  });

  // Track alert ID to detect changes
  const alertIdRef = useRef<string | undefined>(alert?.id);

  // Reset form state when alert prop changes (using key-like pattern with ref)
  // This is a legitimate use case for syncing form state with props
  // We disable the eslint rule as this pattern is necessary for controlled form components
  useEffect(() => {
    const currentAlertId = alert?.id;
    if (currentAlertId !== alertIdRef.current) {
      alertIdRef.current = currentAlertId;
      // Reset form to match new alert (or empty if no alert)
      if (alert) {
        setSymbol(alert.symbol);
        setDirection(alert.direction);
        setThreshold(alert.threshold.toString());
        setStatus(alert.status);
      } else {
        setSymbol("");
        setDirection("above");
        setThreshold("");
        setStatus("active");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alert.id is the key we track
  }, [alert?.id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    }

    const thresholdNum = parseFloat(threshold);
    if (!threshold || isNaN(thresholdNum) || thresholdNum <= 0) {
      newErrors.threshold = "Must be a positive number";
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
          }
        : {
            symbol: symbol.toUpperCase(),
            direction,
            threshold: parseFloat(threshold),
            channel: "notification", // Always use notification channel
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
              <label htmlFor="direction-above">
                Direction <span className="required">*</span>
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    id="direction-above"
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
            <p className="help-text">
              Notifications will be sent to all devices registered for your account. 
              You can manage your registered devices in the Monitoring section.
            </p>
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

