import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useCallback, useEffect, useState } from "react";
import { _getUserById, synchronizeMeta } from "./actions";
import Loader from "@/components/ui/loaders";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { getUserByIdAction } from "@/actions/user.actions";
import { userInclude, type UserWithRelations } from "@/services/user/user.dto";

export default function TabSync() {
  const [user, setUser] = useState<UserWithRelations>();
  const [loading, setLoading] = useState<"waba">();
  const [syncResults, setSyncResults] =
    useState<Record<string, string | string[] | number>>();

  const { data: session } = useSession();

  const getUser = useCallback(async () => {
    if (!session?.user) return;

    console.log(`Fetching user: id-${session.user.id}`);
    const _resUser = await getUserByIdAction(session.user.id, userInclude);
    if (_resUser.ok) setUser(_resUser.data);
  }, [session?.user]);

  const syncWithMeta = useCallback(async () => {
    setSyncResults(undefined);
    const res = await synchronizeMeta();
    if (res) setSyncResults(res);
    setLoading((prev) => {
      if (prev === "waba") return undefined;
    });
  }, []);

  useEffect(() => {
    console.log(`Fetching User...`);
    getUser();
  }, [getUser]);

  return (
    <TabsContent value="sync" className="space-y-4">
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
            {syncResults && (
              <div className="mt-6 rounded-lg border p-4 space-y-3 bg-primary/10">
                <h4 className="font-medium text-sm text-foreground">
                  Sync Results
                </h4>
                <div className="space-y-2 text-xs">
                  {Object.entries(syncResults).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="font-semibold text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span className="font-mono text-foreground">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside space-y-0.5">
                            {value.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          String(value)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Loader />
      )}
    </TabsContent>
  );
}
