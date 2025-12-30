"use client";

import React, { JSX, useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Plus,
  Phone,
  MessageSquare,
  Settings,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import {
  PhoneNumber,
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
  WabaTemplate,
} from "@/lib/prisma/generated";
import { useSession } from "next-auth/react";
import { findWabaTemplatesAction } from "./actions";
import { getAllPhoneNumbers } from "@/data/phoneNumber";

export default function ManagerComponent() {
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState<WabaTemplate[]>();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();

  const fetchTemplates = useCallback(async () => {
    const templates_ = await findWabaTemplatesAction();
    setTemplates(templates_);
  }, []);

  const fetchPhoneNumbers = useCallback(async () => {
    const phoneNos_ = await getAllPhoneNumbers();
    setPhoneNumbers(phoneNos_);
  }, []);

  // load templates and phone numbers
  useEffect(() => {
    fetchTemplates();
    fetchPhoneNumbers();
  }, []);

  // Mock data for templates
  //   const templates: Partial<WabaTemplate>[] = [
  //     {
  //       id: "1",
  //       name: "welcome_message",
  //       status: "APPROVED",
  //       category: "UTILITY",
  //       language: "en_US",
  //       updatedAt: new Date("2024-12-20"),
  //     },
  //     {
  //       id: "2",
  //       name: "order_confirmation",
  //       status: "PENDING",
  //       category: "UTILITY",
  //       language: "en_US",
  //       updatedAt: new Date("2024-12-22"),
  //     },
  //     {
  //       id: "3",
  //       name: "promotional_offer",
  //       status: "REJECTED",
  //       category: "MARKETING",
  //       language: "en_US",
  //       updatedAt: new Date("2024-12-18"),
  //     },
  //   ];

  //   const phoneNumbers: Partial<PhoneNumber>[] = [
  //     {
  //       id: "1",
  //       phoneNumber: "+254712345678",
  //       displayName: "Main Support",
  //       status: "VERIFIED",
  //       verifiedAt: new Date("2024-12-01"),
  //     },
  //     {
  //       id: "2",
  //       phoneNumber: "+254798765432",
  //       displayName: "Sales Team",
  //       status: "NOT_VERIFIED",
  //       verifiedAt: null,
  //     },
  //   ];

  // Mock data for auto-reply rules
  const autoReplyRules = [
    {
      id: "1",
      name: "After Hours Response",
      triggerType: "TIME_BASED",
      phoneNumber: "+254712345678",
      isActive: true,
      priority: 1,
    },
    {
      id: "2",
      name: "Keyword: Help",
      triggerType: "KEYWORD",
      phoneNumber: "+254712345678",
      isActive: true,
      priority: 2,
    },
  ];

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
      APPROVED: <CheckCircle className="w-3 h-3 mr-1" />,
      PENDING: <Clock className="w-3 h-3 mr-1" />,
      REJECTED: <XCircle className="w-3 h-3 mr-1" />,
      DISABLED: <Clock className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center w-fit">
        {icons[status]}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger
            value="phone-numbers"
            className="flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Phone Numbers</span>
          </TabsTrigger>
          <TabsTrigger value="auto-reply" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Auto Reply</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>
                    Manage your WhatsApp message templates and sync with Cloud
                    API
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sync Templates
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Alert className="mb-4">
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  Last synchronized: 2 hours ago. Click &&quot;Sync
                  Templates&quot; to fetch latest templates from Cloud API.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Template Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Language
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Last Updated
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates?.map((template) => (
                      <tr
                        key={template.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {template.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{template.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {template.language}
                        </td>
                        <td className="px-4 py-3">
                          {template.status
                            ? getStatusBadge(template.status)
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {template.updatedAt?.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Phone Numbers Tab */}
        <TabsContent value="phone-numbers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Phone Numbers</CardTitle>
                  <CardDescription>
                    Manage your WhatsApp Business phone numbers
                  </CardDescription>
                </div>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Phone Number
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Phone Number
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Display Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">
                        Verified At
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {phoneNumbers?.map((phone) => (
                      <tr key={phone.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {phone.phoneNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {phone.displayName}
                        </td>
                        <td className="px-4 py-3">{phone.status}</td>
                        <td className="px-4 py-3 text-sm">
                          {phone.verifiedAt?.toLocaleDateString() ||
                            "Not verified"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              Verify
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Auto Reply Tab */}
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
                  <Plus className="w-4 h-4" />
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
                      <tr key={rule.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {rule.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{rule.triggerType}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {rule.phoneNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">{rule.priority}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={rule.isActive ? "default" : "secondary"}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
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
                        <SelectItem value="MESSAGE_TYPE">
                          Message Type
                        </SelectItem>
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

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                View and manage your WhatsApp contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search contacts..." className="pl-10" />
                </div>
              </div>
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Contacts are automatically created when you send or receive
                  messages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WABA Settings</CardTitle>
              <CardDescription>
                Configure your WhatsApp Business Account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input id="account-name" placeholder="My Business Account" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership Type</Label>
                  <Select>
                    <SelectTrigger id="ownership">
                      <SelectValue placeholder="Select ownership" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNED">Owned</SelectItem>
                      <SelectItem value="SHARED">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage your WhatsApp Cloud API credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  API credentials are managed securely through environment
                  variables.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
