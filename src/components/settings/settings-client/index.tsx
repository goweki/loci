"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  User as UserIcon,
  Phone,
  CreditCard,
  Bell,
  Shield,
  Building2,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquareIcon,
} from "lucide-react";
import { UserGetPayload } from "@/data/user";
import { WhatsAppLogo } from "@/components/ui/svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TabWhatsApp from "./tab-whatsapp";
import TabProfile from "./tab-profile";
import TabSubscription from "./subscription";
import TabAutoreplyRules from "./tab-autoReply";
import { strPascalCase } from "@/lib/utils/stringHandlers";
import { TabSecurity } from "./tab-security";

export default function SettingsClient({ user }: { user: UserGetPayload }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  const tabs: { tabName: string; icon: React.ReactNode }[] = [
    { tabName: "profile", icon: <UserIcon className="w-4 h-4" /> },
    { tabName: "chatbots", icon: <WhatsAppLogo className="h-4 w-4" /> },
    { tabName: "subscription", icon: <CreditCard className="w-4 h-4" /> },
    { tabName: "auto-reply", icon: <MessageSquareIcon className="w-4 h-4" /> },
    { tabName: "security", icon: <Shield className="w-4 h-4" /> },
  ];

  const activeTab = tabs.map(({ tabName }) => tabName).includes(tab as any)
    ? tab!
    : "profile";

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-5 lg:w-auto">
        {tabs.map(({ tabName, icon }) => (
          <TabsTrigger
            key={tabName}
            value={tabName}
            className="flex items-center gap-2"
          >
            {icon}
            <span className="hidden sm:inline">{strPascalCase(tabName)}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <TabProfile user={user} />
      </TabsContent>

      {/* WhatsApp Tab */}
      <TabsContent value="chatbots" className="space-y-6">
        <TabWhatsApp waba={user.waba} />
      </TabsContent>

      {/* Subscription Tab */}
      <TabsContent value="subscription" className="space-y-6">
        <TabSubscription />
      </TabsContent>

      {/* AutoReply Tab */}
      <TabsContent value="auto-reply" className="space-y-4">
        <TabAutoreplyRules />
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        <TabSecurity />
      </TabsContent>
    </Tabs>
  );
}
