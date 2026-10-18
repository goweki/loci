"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import TabTemplates from "./tab-templates";
import TabPhoneNumbers from "./tab-phoneNumbers";
import TabAutoreplyRules from "./tab-autoReply";
import TabSync from "./tab-settings";
import { useSearchParams } from "next/navigation";

export default function ManagerComponent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tab ?? "templates");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
        <TabsTrigger value="sync" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Sync from Cloud</span>
        </TabsTrigger>
      </TabsList>

      {/* Templates Tab */}
      <TabTemplates />

      {/* Phone Numbers Tab */}
      <TabPhoneNumbers />

      {/* Auto Reply Tab */}
      <TabAutoreplyRules />

      <TabSync />
    </Tabs>
  );
}
