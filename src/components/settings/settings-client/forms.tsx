"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AutoReplyRule, TriggerType } from "@/lib/prisma/generated";
import {
  createAutoReplyRule,
  updateAutoReplyRule,
} from "@/actions/autoReplyRule.actions";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

type RulePhone = { id: string; phoneNumber: string; displayName: string | null };
type RuleWithPhone = AutoReplyRule & { phoneNumber: RulePhone };

export function AutoReplyRuleDialogue({
  phoneNumbers,
  rule,
  onSaved,
}: {
  phoneNumbers: RulePhone[];
  rule?: RuleWithPhone;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState(rule?.phoneNumberId ?? "");
  const [triggerType, setTriggerType] = useState<TriggerType>(rule?.triggerType ?? TriggerType.KEYWORD);
  const [isPending, startTransition] = useTransition();

  const save = (formData: FormData) => {
    const input = {
      phoneNumberId,
      name: String(formData.get("name") ?? ""),
      triggerType,
      triggerValue: String(formData.get("triggerValue") ?? "").trim() || null,
      replyMessage: String(formData.get("replyMessage") ?? ""),
      priority: Number(formData.get("priority") ?? 100),
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      try {
        if (rule) await updateAutoReplyRule(rule.id, input);
        else await createAutoReplyRule(input);
        toast.success(rule ? "Rule updated" : "Rule created");
        setOpen(false);
        onSaved();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save rule");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {rule ? <Button variant="ghost" size="sm">Edit</Button> : <Button variant="outline">New Rule</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Auto Reply Rule" : "Create Auto Reply Rule"}</DialogTitle>
          <DialogDescription>Rules run before the AI assistant. The default rule is used only when no specific rule matches.</DialogDescription>
        </DialogHeader>
        <form action={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule name</Label>
            <Input id="rule-name" name="name" defaultValue={rule?.name} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-phone">WhatsApp number</Label>
            <Select value={phoneNumberId} onValueChange={setPhoneNumberId} required>
              <SelectTrigger id="rule-phone"><SelectValue placeholder="Select a connected number" /></SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((phone) => <SelectItem key={phone.id} value={phone.id}>{phone.displayName || phone.phoneNumber} · {phone.phoneNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule-trigger">Trigger</Label>
              <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
                <SelectTrigger id="rule-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TriggerType.KEYWORD}>Keyword</SelectItem>
                  <SelectItem value={TriggerType.MESSAGE_TYPE}>Message type</SelectItem>
                  <SelectItem value={TriggerType.DEFAULT}>Default fallback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-priority">Priority (lower runs first)</Label>
              <Input id="rule-priority" name="priority" type="number" min={0} max={1000} defaultValue={rule?.priority ?? 100} required />
            </div>
          </div>
          {triggerType !== TriggerType.DEFAULT && (
            <div className="space-y-2">
              <Label htmlFor="rule-value">{triggerType === TriggerType.KEYWORD ? "Keyword or phrase" : "Message type (text, image, audio, video, document, location)"}</Label>
              <Input id="rule-value" name="triggerValue" defaultValue={rule?.triggerValue ?? ""} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="rule-reply">Reply</Label>
            <Textarea id="rule-reply" name="replyMessage" defaultValue={rule?.replyMessage ?? ""} rows={4} required maxLength={4000} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={rule?.isActive ?? true} /> Active</label>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isPending || phoneNumbers.length === 0}>{isPending ? "Saving…" : "Save rule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewAutoReplyRuleDialogue({
  phoneNumbers,
  onSaved,
}: {
  phoneNumbers: RulePhone[];
  onSaved: () => void;
}) {
  return <AutoReplyRuleDialogue phoneNumbers={phoneNumbers} onSaved={onSaved} />;
}
