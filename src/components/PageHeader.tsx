import React, { type ReactNode } from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={index} className="flex items-center gap-2">
                    {item.href ? (
                      <Link href={item.href} className="hover:underline">
                        {item.label}
                      </Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                    {!isLast && (
                      <span
                        className="material-symbols-outlined text-[14px]"
                        aria-hidden="true"
                      >
                        chevron_right
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-surface">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-base text-on-surface-variant max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 md:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
