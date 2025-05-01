
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight break-words">{title}</h1>
        {description && (
          <p className="text-muted-foreground break-words">
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center flex-wrap gap-2 w-full">
          {actions}
        </div>
      )}
    </div>
  );
}
