"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Send } from "lucide-react";
import RecipientStep from "./receipient-step";
import { NewMessageDTO } from "./dto";
import { CommunicationChannel } from "@/lib/prisma/generated";

export default function NewMessageForm() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<NewMessageDTO>({
    contact: "",
    channel: "WHATSAPP" as CommunicationChannel,
    template: "",
    message: "",
  });

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">New Message</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* STEP 1: CONTACT */}
        {step === 1 && (
          // <div className="space-y-4">
          //   <h2 className="text-lg font-medium">Select Recipient</h2>

          //   <Input
          //     placeholder="Enter phone number or contact name"
          //     value={form.contact}
          //     onChange={(e) => setForm({ ...form, contact: e.target.value })}
          //   />

          //   <div className="flex justify-end">
          //     <Button onClick={next} disabled={!form.contact}>
          //       Next <ArrowRight className="ml-2 w-4 h-4" />
          //     </Button>
          //   </div>
          // </div>
          <RecipientStep
            step={step}
            next={next}
            form={form}
            setForm={setForm}
          />
        )}

        {/* STEP 2: CHANNEL */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Choose Channel</h2>

            <Select
              value={form.channel}
              onValueChange={(value: CommunicationChannel) =>
                setForm({ ...form, channel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"WHATSAPP" as CommunicationChannel}>
                  WhatsApp
                </SelectItem>
                <SelectItem value={"SMS" as CommunicationChannel}>
                  SMS
                </SelectItem>
                {/* <SelectItem value={"EMAIL" as CommunicationChannel}>Email</SelectItem> */}
              </SelectContent>
            </Select>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>

              <Button onClick={next}>
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: MESSAGE */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Compose Message</h2>

            <Select
              onValueChange={(value) =>
                setForm({ ...form, template: value, message: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Use template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hi {{name}}, your payment of {{amount}} was received.">
                  Payment Receipt
                </SelectItem>
                <SelectItem value="Reminder: your appointment is tomorrow at {{time}}">
                  Reminder
                </SelectItem>
                <SelectItem value="Your OTP is {{code}}. It expires in 5 minutes.">
                  OTP
                </SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              rows={6}
              placeholder="Type your message..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>

              <Button onClick={next} disabled={!form.message}>
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Review</h2>

            <div className="bg-muted p-4 rounded-xl text-sm space-y-2">
              <p>
                <strong>To:</strong> {form.contact}
              </p>
              <p>
                <strong>Channel:</strong> {form.channel}
              </p>
              <p>
                <strong>Message:</strong>
              </p>
              <p className="whitespace-pre-line">{form.message}</p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>

              <Button>
                <Send className="mr-2 w-4 h-4" />
                Send Message
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
