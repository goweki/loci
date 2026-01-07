// Helper to get status badge

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; icon: any }> = {
    ACTIVE: { variant: "default", icon: CheckCircle2 },
    VERIFIED: { variant: "default", icon: CheckCircle2 },
    APPROVED: { variant: "default", icon: CheckCircle2 },
    PENDING: { variant: "secondary", icon: AlertCircle },
    SUSPENDED: { variant: "destructive", icon: XCircle },
    REJECTED: { variant: "destructive", icon: XCircle },
    DISABLED: { variant: "outline", icon: XCircle },
  };

  const config = variants[status] || {
    variant: "secondary",
    icon: AlertCircle,
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};
