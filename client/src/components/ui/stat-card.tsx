import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, iconColor, iconBgColor, trend, className }: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-6 border border-neutral-200", className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <h3 className={cn("text-2xl font-bold text-neutral-900", typeof value === "number" && "font-mono")}>
            {value}
          </h3>
        </div>
        <div className={cn("rounded-full p-2", iconBgColor)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center">
          <span 
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              trend.positive 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            )}
          >
            <svg 
              className="h-3 w-3 mr-1" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {trend.positive ? (
                <path 
                  fillRule="evenodd" 
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                  clipRule="evenodd"
                />
              ) : (
                <path 
                  fillRule="evenodd" 
                  d="M12 13a1 1 0 100-2H7a1 1 0 100 2h5zm-7-8a1 1 0 100-2H5a1 1 0 000 2h2.586l6.293 6.293a1 1 0 001.414-1.414L8 6.586V5z" 
                  clipRule="evenodd"
                />
              )}
            </svg>
            {trend.value}%
          </span>
          <span className="text-xs text-neutral-500 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
