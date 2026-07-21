"use client";

import React, { useState } from "react";
import { Share2, Mail, MessageSquare, Phone } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import InputPhone from "@/components/ui/input-phone";
import { removePlus } from "@/lib/utils/telHandlers";

export function ShareLinkDialog({
  productLink: codeGeneratedLink,
}: {
  productLink: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneChannel, setPhoneChannel] = useState<"whatsapp" | "sms">(
    "whatsapp",
  );
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const handleSendPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    if (phoneChannel === "whatsapp") {
      // Clean phone number (strip non-digits for standard wa.me format)
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Here is the link: ${codeGeneratedLink}`,
      )}`;
      window.open(waUrl, "_blank");
    } else {
      // SMS link schema
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(
        `Here is the link: ${codeGeneratedLink}`,
      )}`;
      window.location.href = smsUrl;
    }

    setOpen(false);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      "Shared Link",
    )}&body=${encodeURIComponent(`Here is the link: ${codeGeneratedLink}`)}`;
    window.location.href = mailtoUrl;

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Link
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Link</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to share this link with your recipient.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="phone" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone" className="gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* PHONE TAB */}
          <TabsContent value="phone">
            <form onSubmit={handleSendPhone} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Recipient&apos;s Phone Number</Label>
                <InputPhone
                  name="phone"
                  value={phoneNumber ? `+${phoneNumber}` : ""}
                  setValue={(val) => setPhoneNumber(removePlus(val || ""))}
                />
              </div>

              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <RadioGroup
                  defaultValue="whatsapp"
                  value={phoneChannel}
                  onValueChange={(val) =>
                    setPhoneChannel(val as "whatsapp" | "sms")
                  }
                  className="grid grid-cols-2 gap-4 pt-1"
                >
                  <div>
                    <RadioGroupItem
                      value="whatsapp"
                      id="channel-wa"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="channel-wa"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <MessageSquare className="mb-1 h-5 w-5 text-emerald-600" />
                      <span className="text-xs font-medium">WhatsApp</span>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="sms"
                      id="channel-sms"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="channel-sms"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Phone className="mb-1 h-5 w-5 text-blue-600" />
                      <span className="text-xs font-medium">SMS</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full">
                  Send via {phoneChannel === "whatsapp" ? "WhatsApp" : "SMS"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* EMAIL TAB */}
          <TabsContent value="email">
            <form onSubmit={handleSendEmail} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient&apos;s Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full">
                  Send via Email
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
