import { cn } from "@/lib/utils";
import { PageBreadcrumb, type PageBreadcrumbItem } from "@/components/ui/page-breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  breadcrumbs?: PageBreadcrumbItem[];
}

export function PageHeader({ title, description, actions, className, breadcrumbs }: PageHeaderProps) {
  return (
    <>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <PageBreadcrumb items={breadcrumbs} />
      )}
      <div className={cn("mb-8 flex flex-col md:flex-row md:items-center md:justify-between", className)}>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h1>
          {description && <p className="text-neutral-600">{description}</p>}
        </div>
        {actions && (
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
