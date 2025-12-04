// components/dashboard/templates/template-filters.tsx

"use client";

import { InputWithIcon } from "@/components/ui/input";
import {
  TemplateCategory,
  TemplateApprovalStatus as TemplateStatus,
} from "@/lib/prisma/generated";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TemplateFiltersProps {
  searchQuery: string;
  statusFilter: TemplateStatus | "ALL";
  categoryFilter: TemplateCategory | "ALL";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TemplateStatus | "ALL") => void;
  onCategoryChange: (value: TemplateCategory | "ALL") => void;
}

export function TemplateFilters({
  searchQuery,
  statusFilter,
  categoryFilter,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 flex-1">
      {/* Search */}
      <InputWithIcon
        icon={Search}
        type="text"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search templates"
      />

      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(val) => onStatusChange(val as TemplateStatus | "ALL")}
        aria-label="Filter by status"
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="Rejected">Rejected</SelectItem>
          <SelectItem value="DISABLED">Disabled</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter */}

      <Select
        aria-label="Filter by category"
        value={categoryFilter}
        onValueChange={(val) =>
          onCategoryChange(val as TemplateCategory | "ALL")
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          <SelectItem value="MARKETING">Marketing</SelectItem>
          <SelectItem value="UTILITY">Utility</SelectItem>
          <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
