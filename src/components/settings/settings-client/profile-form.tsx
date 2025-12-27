import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserGetPayload } from "@/data/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, CheckCircle2 } from "lucide-react";
import { getStatusBadge } from "./get-status-badge";

export default function ProfileForm({ user }: { user: UserGetPayload }) {
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
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-2" />
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
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-2" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Account Status</Label>
          <div>{getStatusBadge(user.status)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        Member since {new Date(user.createdAt).toLocaleDateString()}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save </Button>
      </div>
    </CardContent>
  );
}
