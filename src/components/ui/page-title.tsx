import { LucideIcon, ChevronRight, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import React from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
};

export default function TitleSection({
  icon: Icon,
  title,
  subtitle,
  description,
  breadcrumbs,
}: Props) {
  return (
    <section className="container flex flex-col gap-3 px-0">
      {/* Breadcrumb Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Link href="/" className="hover:text-foreground transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground truncate">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <h1 className="text-xl font-bold tracking-tight m-0">{title}</h1>
          {subtitle && (
            <Badge variant="secondary" className="rounded-full px-2.5">
              {subtitle}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-[750px] leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
