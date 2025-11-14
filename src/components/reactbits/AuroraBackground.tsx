import "./aurora.css";

type AuroraBackgroundProps = {
  children: React.ReactNode;
  variant?: "login" | "dashboard";
};

/**
 * Inspired by the ReactBits Aurora snippets – renders blurred gradient blobs that animate slowly.
 */
export function AuroraBackground({
  children,
  variant = "dashboard",
}: AuroraBackgroundProps) {
  return (
    <div className={`aurora-shell aurora-${variant}`}>
      <div className="aurora-blur aurora-one" />
      <div className="aurora-blur aurora-two" />
      <div className="aurora-blur aurora-three" />
      <div className="aurora-content">{children}</div>
    </div>
  );
}
