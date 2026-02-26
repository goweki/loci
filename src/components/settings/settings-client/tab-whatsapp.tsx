import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Building2Icon, Phone } from "lucide-react";
import { getStatusBadge } from "./utilities";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import WabaEmbeddedSignup from "@/components/ui/waba-embedded-signup";
import { PhoneNumber, WabaAccount } from "@/lib/prisma/generated";

interface Waba extends WabaAccount {
  phoneNumbers: PhoneNumber[];
}

export default function TabWhatsApp({ waba }: { waba: Waba | null }) {
  return (
    <TabsContent value="chatbots" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business Account</CardTitle>
          <CardDescription>
            Manage your WhatsApp Business API integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {waba ? (
            <>
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Building2Icon className="w-10 h-10 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    Whatsapp Business Account Connected
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Name: {waba.name}
                  </p>
                </div>
                {getStatusBadge("ACTIVE")}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Whatsapp Numbers</h3>
                  <Button size="sm">Add Number</Button>
                </div>

                {waba.phoneNumbers.length > 0 ? (
                  <div className="space-y-3">
                    {waba.phoneNumbers.map((phone) => (
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
                    No WhatsApp numbers added yet
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Building2Icon className="w-16 h-16 mx-auto text-muted-foreground" />
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
  );
}
