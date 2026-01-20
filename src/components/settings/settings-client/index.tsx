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
import TabSubscription from "./tab-subscription";
import TabAutoreplyRules from "./tab-autoReply";
import { strPascalCase } from "@/lib/utils/stringHandlers";

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
    { tabName: "whatsapp", icon: <WhatsAppLogo className="h-4 w-4" /> },
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
      <TabProfile user={user} />

      {/* WhatsApp Tab */}
      <TabWhatsApp waba={user.waba} />

      {/* Subscription Tab */}
      <TabSubscription />

      {/* AutoReply Tab */}
      <TabAutoreplyRules />

      {/* Notifications Tab */}
      {/* <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get updates on WhatsApp
                  </p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Message Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when you receive new messages
                  </p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Billing Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for upcoming payments
                  </p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            </div>

            <div className="flex justify-end">
              <Button>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent> */}

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage your password and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Update Password</Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline">Enable 2FA</Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
