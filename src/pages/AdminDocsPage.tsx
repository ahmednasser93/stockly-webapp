import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { useOpenApiSpec } from "../hooks/useOpenApiSpec";

export function AdminDocsPage() {
  const { spec, error } = useOpenApiSpec();

  if (error) {
    return (
      <section className="page">
        <div className="card error">Failed to load API docs: {error}</div>
      </section>
    );
  }

  if (!spec) {
    return (
      <section className="page">
        <div className="card">Loading Swagger UI…</div>
      </section>
    );
  }

  return (
    <section className="page" aria-label="Admin Docs">
      <div className="card">
        <h2>Stockly Admin API</h2>
        <p className="muted">Interact with backend endpoints directly from the console.</p>
      </div>
      <div className="card swagger-panel">
        <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} />
      </div>
    </section>
  );
}
