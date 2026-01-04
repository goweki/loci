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
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
// import { prisma } from "@/lib/prisma";
import { useSession } from "next-auth/react";
import { getUserById, UserGetPayload } from "@/data/user";
import { Prisma } from "@/lib/prisma/generated";
import { getStatusBadge } from "./get-status-badge";
import ProfileForm from "./profile-form";
import WabaEmbeddedSignup from "@/components/ui/waba-embedded-signup";
import { WhatsAppLogo } from "@/components/ui/svg";
import { useSearchParams } from "next/navigation";

export default function SettingsClient({ user }: { user: UserGetPayload }) {
  const activeSubscription = user.subscriptions[0];
  const phoneNumbers = user.waba?.phoneNumbers || [];

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const allowedTabs = [
    "profile",
    "whatsapp",
    "billing",
    "notifications",
    "security",
  ] as const;

  const activeTab = allowedTabs.includes(tab as any) ? tab! : "profile";

  return (
    <Tabs value={activeTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 lg:w-auto">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <UserIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="flex items-center gap-2">
          <WhatsAppLogo className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Billing</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account profile information
            </CardDescription>
          </CardHeader>
          <ProfileForm user={user} />
        </Card>
      </TabsContent>

      {/* WhatsApp Tab */}
      <TabsContent value="whatsapp" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Business Account</CardTitle>
            <CardDescription>
              Manage your WhatsApp Business API integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user.waba ? (
              <>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Building2 className="w-10 h-10 text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Business Account Connected
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Name: {user.waba.name}
                    </p>
                  </div>
                  {getStatusBadge("ACTIVE")}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Phone Numbers</h3>
                    <Button size="sm">Add Number</Button>
                  </div>

                  {phoneNumbers.length > 0 ? (
                    <div className="space-y-3">
                      {phoneNumbers.map((phone) => (
                        <div
                          key={phone.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {phone.displayName || phone.phoneNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {phone.phoneNumber}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(phone.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No phone numbers added yet
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    No WhatsApp Business Account Connected
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Connect your WhatsApp Business API account to start sending
                    and receiving messages
                  </p>
                </div>
                <WabaEmbeddedSignup label="Create WhatsApp Integration" />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing Tab */}
      <TabsContent value="billing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription & Billing</CardTitle>
            <CardDescription>
              Manage your subscription plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeSubscription ? (
              <>
                <div className="p-6 border rounded-lg space-y-4 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold">
                        {activeSubscription.plan.name} Plan
                      </h3>
                      <p className="text-muted-foreground">
                        {activeSubscription.plan.description}
                      </p>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {activeSubscription.plan.interval}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      KSH {activeSubscription.plan.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      /{activeSubscription.plan.interval.toLowerCase()}
                    </span>
                  </div>

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>
                        {activeSubscription.plan.maxPhoneNumbers} Phone Numbers
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>
                        {activeSubscription.plan.maxMessagesPerMonth.toLocaleString()}{" "}
                        Messages/month
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Cancel Subscription
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Billing Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">
                        Next billing date
                      </span>
                      <span className="font-medium">
                        {new Date(
                          activeSubscription.startDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">
                        Payment method
                      </span>
                      <Button variant="ghost" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 space-y-4">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    No Active Subscription
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Choose a plan to start using our WhatsApp Business services
                  </p>
                </div>
                <Button>View Plans</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your past transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No payment history available
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6">
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
      </TabsContent>

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
