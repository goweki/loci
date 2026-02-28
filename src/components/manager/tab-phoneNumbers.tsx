import { EditIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { TabsContent } from "../ui/tabs";
import { getAllPhoneNumbers } from "@/data/phoneNumber";
import { PhoneNumber } from "@/lib/prisma/generated";
import { useCallback, useEffect, useState } from "react";
import Loader from "../ui/loaders";

export default function TabPhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>();

  const fetchPhoneNumbers = useCallback(async () => {
    const phoneNos_ = await getAllPhoneNumbers();
    setPhoneNumbers(phoneNos_);
  }, []);

  // load templates and phone numbers
  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  return (
    <TabsContent value="phone-numbers" className="space-y-4">
      {phoneNumbers ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Phone Numbers</CardTitle>
                <CardDescription>
                  Manage your WhatsApp Business phone numbers
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  Add Phone Number
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-popover">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Phone Number
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Display Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Verified At
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {phoneNumbers?.map((phone) => (
                    <tr key={phone.id} className="border-b hover:bg-popover">
                      <td className="px-4 py-3 text-sm font-medium">
                        {phone.phoneNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">{phone.displayName}</td>
                      <td className="px-4 py-3">{phone.status}</td>
                      <td className="px-4 py-3 text-sm">
                        {phone.verifiedAt?.toLocaleDateString() ||
                          "Not verified"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            Verify
                          </Button>
                          <Button variant="ghost" size="sm">
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Loader />
      )}
    </TabsContent>
  );
}
