import { SettingsIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { TabsContent } from "../ui/tabs";
import { useCallback, useEffect, useState } from "react";
import { synchronizeMeta } from "./actions";
import Loader from "../ui/loaders";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { useSession } from "next-auth/react";
import { getUserById, UserGetPayload } from "@/data/user";

export default function TabSettings() {
  const [user, setUser] = useState<UserGetPayload>();
  const [loading, setLoading] = useState<"waba">();

  const { data: session } = useSession();

  const getUser = useCallback(async () => {
    if (!session?.user) return;

    console.log(`Fetching user: id-${session.user.id}`);
    const _user = await getUserById(session.user.id);
    if (_user) setUser(_user);
  }, []);

  const syncWithMeta = useCallback(async () => {
    await synchronizeMeta();
    setLoading((prev) => {
      if (prev === "waba") return undefined;
    });
  }, []);

  useEffect(() => {
    console.log(`Fetching User...`);
    getUser();
  }, []);

  return (
    <TabsContent value="settings" className="space-y-4">
      {user ? (
        <Card>
          <CardHeader className="hidden"></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 mt-4">
                <Label htmlFor="account-name">WABA Account Name</Label>
                <Input
                  id="waba-name"
                  placeholder="Whatsapp Business Account Name"
                  value={user.waba?.name}
                  disabled={true}
                />
              </div>
              <Button
                onClick={() => {
                  setLoading("waba");
                  syncWithMeta();
                }}
                disabled={loading === "waba"}
                variant="outline"
              >
                Sync Waba Assets with Cloud API{" "}
                {loading == "waba" && <Loader size={4} />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Loader />
      )}
    </TabsContent>
  );
}
