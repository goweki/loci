import {
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { JSX, useCallback, useEffect, useState } from "react";
import { TemplateApprovalStatus, WabaTemplate } from "@/lib/prisma/generated";
import { findWabaTemplatesAction, synchronizeMeta } from "./actions";
import Loader from "../ui/loaders";

const getStatusBadge = (status: TemplateApprovalStatus) => {
  const variants: Record<
    TemplateApprovalStatus,
    "default" | "secondary" | "destructive"
  > = {
    APPROVED: "default",
    PENDING: "secondary",
    REJECTED: "destructive",
    DISABLED: "secondary",
  };

  const icons: Record<TemplateApprovalStatus, JSX.Element> = {
    APPROVED: <CheckCircleIcon className="w-3 h-3 mr-1" />,
    PENDING: <ClockIcon className="w-3 h-3 mr-1" />,
    REJECTED: <XCircleIcon className="w-3 h-3 mr-1" />,
    DISABLED: <ClockIcon className="w-3 h-3 mr-1" />,
  };

  return (
    <Badge variant={variants[status]} className="flex items-center w-fit">
      {icons[status]}
      {status.replace("_", " ")}
    </Badge>
  );
};

export default function TabTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<WabaTemplate[]>();

  const fetchTemplates = useCallback(async () => {
    const templates_ = await findWabaTemplatesAction();
    setTemplates(templates_);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <TabsContent value="templates" className="space-y-4">
      {templates ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Manage your WhatsApp message templates and sync with Cloud API
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button>
                  <PlusIcon className="w-4 h-4" />
                  New Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-popover">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Template Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Language
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Last Updated
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates?.map((template) => (
                    <tr key={template.id} className="border-b hover:bg-popover">
                      <td className="px-4 py-3 text-sm font-medium">
                        {template.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{template.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{template.language}</td>
                      <td className="px-4 py-3">
                        {template.status ? getStatusBadge(template.status) : ""}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {template.updatedAt?.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Loader />
      )}
    </TabsContent>
  );
}
