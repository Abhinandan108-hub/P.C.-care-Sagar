import { ElementType } from "react";
import { ArrowUpRight, Minus } from "lucide-react";

interface DashboardCardProps {
  label: string;
  value: number | string;
  icon: ElementType;
  color: "blue" | "green" | "amber" | "teal";
  trend?: string;
}

const colorMap = {
  blue: { bg: "rgba(47, 93, 255, 0.1)", ink: "#2f5dff" },
  green: { bg: "rgba(22, 163, 74, 0.1)", ink: "#16a34a" },
  amber: { bg: "rgba(217, 119, 6, 0.1)", ink: "#d97706" },
  teal: { bg: "rgba(0, 194, 168, 0.12)", ink: "#00998a" },
};

export default function DashboardCard({ label, value, icon: Icon, color, trend }: DashboardCardProps) {
  const c = colorMap[color];

  return (
    <div className="admin-card">
      <div className="admin-card__top">
        <div className="admin-card__icon" style={{ background: c.bg, color: c.ink }}>
          <Icon />
        </div>
        {trend ? (
          <span className="admin-card__trend admin-card__trend--up">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        ) : (
          <span className="admin-card__trend admin-card__trend--flat">
            <Minus size={12} />
            0%
          </span>
        )}
      </div>
      <div>
        <div className="admin-card__value">{value}</div>
        <div className="admin-card__label">{label}</div>
      </div>
    </div>
  );
}
