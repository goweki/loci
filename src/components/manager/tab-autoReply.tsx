import { EditIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { TabsContent } from "../ui/tabs";
import { AutoReplyRule } from "@/lib/prisma/generated";
import { useCallback, useEffect, useState } from "react";
import { getAllAutoReplyRules } from "@/data/autoReplyRule";
import Loader from "../ui/loaders";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

export default function TabAutoreplyRules() {
  const [autoReplyRules, setAutoReplyRules] = useState<AutoReplyRule[]>();

  const fetchPhoneNumbers = useCallback(async () => {
    const _autoReplyRules = await getAllAutoReplyRules();
    setAutoReplyRules(_autoReplyRules);
  }, []);

  // load templates and phone numbers
  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  return autoReplyRules ? (
    <TabsContent value="auto-reply" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Auto Reply Rules</CardTitle>
              <CardDescription>
                Configure automated responses for your WhatsApp messages
              </CardDescription>
            </div>
            <Button className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              New Rule
            </Button>
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
                    <td className="px-4 py-3 text-sm font-medium">
                      {rule.name}
                    </td>
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

      <Card>
        <CardHeader>
          <CardTitle>Create Auto Reply Rule</CardTitle>
          <CardDescription>
            Set up a new automated response rule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., After Hours Response"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-select">Phone Number</Label>
                <Select>
                  <SelectTrigger id="phone-select">
                    <SelectValue placeholder="Select phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+254712345678</SelectItem>
                    <SelectItem value="2">+254798765432</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-type">Trigger Type</Label>
                <Select>
                  <SelectTrigger id="trigger-type">
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KEYWORD">Keyword</SelectItem>
                    <SelectItem value="MESSAGE_TYPE">Message Type</SelectItem>
                    <SelectItem value="TIME_BASED">Time Based</SelectItem>
                    <SelectItem value="DEFAULT">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger-value">Trigger Value</Label>
                <Input id="trigger-value" placeholder="e.g., help, hi" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-message">Reply Message</Label>
              <Textarea
                id="reply-message"
                placeholder="Enter your automated response message..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Create Rule</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  ) : (
    <Loader />
  );
}
