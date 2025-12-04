// app/dashboard/templates/templates-client.tsx
"use client";

import { useState, useMemo } from "react";
import type { WabaTemplate } from "@/lib/prisma/generated";
import { TemplateCard } from "./template-card";
import { TemplateFilters } from "./template-filters";
import { CreateTemplateButton } from "./create-template-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplatesClientProps {
  initialTemplates: WabaTemplate[];
}

export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

interface StatCardProps {
  label: string;
  value: number;
  color?: "green" | "yellow" | "red";
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
    red: "text-red-600 bg-red-50",
  };

  const baseClass = color ? colorClasses[color] : "text-primary bg-muted";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <p className="text-sm text-muted-foreground mb-1">{label}</p> */}
        <p className={`text-3xl font-bold ${baseClass.split(" ")[0]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const [templates] = useState<WabaTemplate[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "ALL">(
    "ALL"
  );
  const [categoryFilter, setCategoryFilter] = useState<
    TemplateCategory | "ALL"
  >("ALL");

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || template.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" || template.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, searchQuery, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: templates.length,
      approved: templates.filter((t) => t.status === "APPROVED").length,
      pending: templates.filter((t) => t.status === "PENDING").length,
      rejected: templates.filter((t) => t.status === "REJECTED").length,
    };
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Templates" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} color="green" />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <TemplateFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategoryFilter}
        />
        <CreateTemplateButton />
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-muted-foreground text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-lg mb-2">No templates found</p>
          <p className="text-sm italic">
            Try adjusting your filters or create a new template
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
