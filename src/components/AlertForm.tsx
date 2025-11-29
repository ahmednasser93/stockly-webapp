import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchSymbols } from "../api/client";
import type {
  Alert,
  AlertDirection,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertStatus,
} from "../types";

interface Device {
  userId: string;
  pushToken: string;
  deviceInfo: string | null;
  alertCount?: number;
  activeAlertCount?: number;
}

interface AlertFormProps {
  alert?: Alert | null;
  onSubmit: (data: CreateAlertRequest | UpdateAlertRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  devices?: Device[];
}

export function AlertForm({
  alert,
  onSubmit,
  onCancel,
  isSubmitting,
  devices = [],
}: AlertFormProps) {
  // Initialize state from alert prop, reset when alert changes
  const getInitialSymbol = () => alert?.symbol ?? "";
  const getInitialDirection = (): AlertDirection => alert?.direction ?? "above";
  const getInitialThreshold = () => alert?.threshold?.toString() ?? "";
  const getInitialStatus = (): AlertStatus => alert?.status ?? "active";
  const getInitialTarget = () => alert?.target ?? "";
  const getInitialDeviceId = (): string => {
    if (alert?.target) {
      const matchingDevice = devices.find((d) => d.pushToken === alert.target);
      return matchingDevice?.userId ?? "";
    }
    return "";
  };

  const [symbol, setSymbol] = useState(getInitialSymbol);
  const [direction, setDirection] = useState<AlertDirection>(getInitialDirection);
  const [threshold, setThreshold] = useState(getInitialThreshold);
  const [status, setStatus] = useState<AlertStatus>(getInitialStatus);
  const [target, setTarget] = useState(getInitialTarget);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(getInitialDeviceId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["search", symbol],
    queryFn: () => searchSymbols(symbol.trim()),
    enabled: symbol.trim().length >= 2 && !alert,
    staleTime: 5 * 60 * 1000,
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
        setTarget(alert.target);
        const matchingDevice = devices.find((d) => d.pushToken === alert.target);
        setSelectedDeviceId(matchingDevice?.userId ?? "");
      } else {
        setSymbol("");
        setDirection("above");
        setThreshold("");
        setStatus("active");
        setTarget("");
        setSelectedDeviceId("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alert.id is the key we track, devices is needed for device lookup
  }, [alert?.id, devices]);

  // When device is selected, update target field
  useEffect(() => {
    if (selectedDeviceId && !alert) {
      const selectedDevice = devices.find((d) => d.userId === selectedDeviceId);
      if (selectedDevice) {
        setTarget(selectedDevice.pushToken);
      }
    }
  }, [selectedDeviceId, devices, alert]);

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
            <label htmlFor="device-select">
              Device / User <span className="required">*</span>
            </label>
            {devices.length > 0 && !alert ? (
              <>
                <select
                  id="device-select"
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    const selectedDevice = devices.find((d) => d.userId === e.target.value);
                    if (selectedDevice) {
                      setTarget(selectedDevice.pushToken);
                    }
                  }}
                  disabled={isSubmitting}
                  className={errors.target ? "error" : ""}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    border: "1px solid var(--ghost-border)",
                    borderRadius: "6px",
                    background: "var(--bg)",
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <option value="">Select a device...</option>
                  {devices.map((device) => (
                    <option key={device.userId} value={device.userId}>
                      {device.userId} {device.deviceInfo ? `(${device.deviceInfo})` : ""} 
                      {device.alertCount !== undefined ? ` - ${device.alertCount} alert${device.alertCount !== 1 ? "s" : ""}` : ""}
                    </option>
                  ))}
                </select>
                <p className="help-text">
                  Select a registered device to automatically use its push token. Or enter a token manually below.
                </p>
              </>
            ) : null}
            <label htmlFor="target" style={{ marginTop: devices.length > 0 && !alert ? "1rem" : "0" }}>
              FCM Token (Notification Target) <span className="required">*</span>
            </label>
            <input
              id="target"
              type="text"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                // Clear device selection if manually editing token
                if (selectedDeviceId) {
                  const selectedDevice = devices.find((d) => d.userId === selectedDeviceId);
                  if (selectedDevice && e.target.value !== selectedDevice.pushToken) {
                    setSelectedDeviceId("");
                  }
                }
              }}
              placeholder="Enter FCM token from mobile app"
              disabled={isSubmitting}
              readOnly={false}
              className={errors.target ? "error" : ""}
            />
            <p className="help-text">
              {alert 
                ? "The FCM token for this alert. Update it if the device token has changed."
                : "The FCM token is used to send push notifications to your device. Select a device above or enter the token manually."}
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

