export function ensureOpenApiVersion(spec: Record<string, unknown>) {
  if (spec.openapi || spec.swagger) {
    return spec;
  }
  return {
    openapi: "3.0.0",
    ...spec,
  };
}
