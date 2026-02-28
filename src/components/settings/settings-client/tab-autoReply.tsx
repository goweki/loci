import { EditIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { AutoReplyRule } from "@/lib/prisma/generated";
import { useCallback, useEffect, useState } from "react";
import { getAllAutoReplyRules } from "@/data/autoReplyRule";
import Loader from "@/components/ui/loaders";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NewAutoReplyRuleDialogue } from "./forms";

export default function TabAutoreplyRules() {
  const [autoReplyRules, setAutoReplyRules] = useState<AutoReplyRule[]>();

  const fetchPhoneNumbers = useCallback(async () => {
    const _autoReplyRules = await getAllAutoReplyRules();
    setAutoReplyRules(_autoReplyRules);
  }, []);

  // load templates and phone numbers
  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  return autoReplyRules ? (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Auto Reply Rules</CardTitle>
            <CardDescription>
              Configure automated responses for your WhatsApp messages
            </CardDescription>
          </div>
          <NewAutoReplyRuleDialogue />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                  Rule Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                  Trigger Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {autoReplyRules.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-popover">
                  <td className="px-4 py-3 text-sm font-medium">{rule.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{rule.triggerType}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{rule.phoneNumberId}</td>
                  <td className="px-4 py-3 text-sm">{rule.priority}</td>
                  <td className="px-4 py-3">
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
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
  );
}
