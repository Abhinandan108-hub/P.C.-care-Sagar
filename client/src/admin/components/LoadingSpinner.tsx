interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md";
  onAccent?: boolean;
}

export default function LoadingSpinner({
  label,
  size = "md",
  onAccent = false,
}: LoadingSpinnerProps) {
  const spinnerClass = [
    "admin-spinner",
    size === "sm" ? "admin-spinner--sm" : "",
    onAccent ? "admin-spinner--onaccent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!label) {
    return <span className={spinnerClass} />;
  }

  return (
    <div className="admin-loading-block">
      <span className={spinnerClass} />
      <p>{label}</p>
    </div>
  );
}
