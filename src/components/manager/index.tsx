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
  RefreshCwIcon,
} from "lucide-react";
import {
  AutoReplyRule,
  PhoneNumber,
  TriggerType,
} from "@/lib/prisma/generated";
import TabTemplates from "./tab-templates";
import TabPhoneNumbers from "./tab-phoneNumbers";
import TabAutoreplyRules from "./tab-autoReply";
import TabSettings from "./tab-settings";

export default function ManagerComponent() {
  const [activeTab, setActiveTab] = useState("templates");
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>();

  const autoReplyRules: AutoReplyRule[] = [
    {
      id: "1",
      name: "After Hours Response",
      triggerType: TriggerType.TIME_BASED,
      isActive: true,
      priority: 1,
      createdById: "01",
      createdAt: new Date("01-01-2025"),
      updatedAt: new Date("01-01-2025"),
      phoneNumberId: "01",
      triggerValue: null,
      replyMessage:
        "Thanks for reaching out! Your message has been received, and we’ll get back to you soon if a response is needed.",
      active: true,
    },
    {
      id: "2",
      name: "Location shared",
      triggerType: TriggerType.MESSAGE_TYPE,
      isActive: true,
      priority: 1,
      createdById: "2",
      createdAt: new Date("01-01-2025"),
      updatedAt: new Date("01-01-2025"),
      phoneNumberId: "01",
      triggerValue: null,
      replyMessage:
        "Thanks for reaching out! Your message has been received, and we’ll get back to you soon if a response is needed.",
      active: true,
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Templates</span>
        </TabsTrigger>
        <TabsTrigger value="phone-numbers" className="flex items-center gap-2">
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
      <TabTemplates />

      {/* Phone Numbers Tab */}
      <TabPhoneNumbers />

      {/* Auto Reply Tab */}
      <TabAutoreplyRules />

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
      <TabSettings />
    </Tabs>
  );
}
