import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, CheckCircle2Icon } from "lucide-react";
import { getStatusBadge } from "./utilities";
import { UserGetPayload } from "@/data/user";

export default function TabProfile({ user }: { user: UserGetPayload }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account profile information
          </CardDescription>
        </CardHeader>
        <ProfileForm />
      </Card>

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
    </>
  );

  function ProfileForm() {
    return (
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="text-xl">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, GIF or PNG. Max size of 2MB
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={user.name || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                defaultValue={user.email || ""}
                className="flex-1"
              />
              {user.emailVerified && (
                <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-2" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="tel"
                type="tel"
                defaultValue={user.tel || ""}
                className="flex-1"
              />
              {user.telVerified && (
                <CheckCircle2Icon className="w-5 h-5 text-green-500 mt-2" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Account Status</Label>
            <div>{getStatusBadge(user.status)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="w-4 h-4" />
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save </Button>
        </div>
      </CardContent>
    );
  }
}
