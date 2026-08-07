import { ElementType, ReactNode } from "react";
import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="admin-empty-state admin-table-empty">
      <Icon />
      <h4>{title}</h4>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
