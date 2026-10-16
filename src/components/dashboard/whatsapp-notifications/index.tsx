"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cancelWhatsAppCampaign, createWhatsAppCampaign, getWhatsAppNotificationSetup, setWhatsAppConsent } from "@/actions/whatsapp-notification.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Setup = Awaited<ReturnType<typeof getWhatsAppNotificationSetup>>;

function toLocalDateTimeInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function templateVariableCount(components: unknown) {
  if (!Array.isArray(components)) return 0;
  const body = components.find((component) => component && typeof component === "object" && "type" in component && component.type === "BODY") as { text?: unknown } | undefined;
  if (typeof body?.text !== "string") return 0;
  const indices = [...body.text.matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
  return indices.length ? Math.max(...indices) : 0;
}

export function WhatsAppNotifications({ initialSetup }: { initialSetup: Setup }) {
  const [setup, setSetup] = useState(initialSetup);
  const [phoneNumberId, setPhoneNumberId] = useState(initialSetup.selectedId ?? "");
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => toLocalDateTimeInput(new Date(Date.now() + 5 * 60_000)));
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [parameters, setParameters] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const template = setup.templates.find((item) => item.id === templateId);
  const requiredParameters = useMemo(() => templateVariableCount(template?.components), [template]);
  const eligible = setup.contacts.filter((contact) => contact.whatsappOptInAt && !contact.whatsappOptOutAt);

  async function refresh(numberId: string) {
    setPhoneNumberId(numberId);
    setTemplateId("");
    setSelectedContacts([]);
    try {
      setSetup(await getWhatsAppNotificationSetup(numberId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load notification data");
    }
  }

  function markConsent(contactId: string, optedIn: boolean) {
    let source: string | undefined;
    if (optedIn) {
      source = window.prompt("Record how the customer gave WhatsApp consent (for example, signed form or in-person request):")?.trim();
      if (!source) return;
    } else if (!window.confirm("Record that this customer opted out of WhatsApp notifications?")) return;
    startTransition(async () => {
      try {
        await setWhatsAppConsent({ contactId, optedIn, source });
        setSetup(await getWhatsAppNotificationSetup(phoneNumberId));
        toast.success(optedIn ? "Consent recorded" : "Opt-out recorded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update consent");
      }
    });
  }

  function submitCampaign() {
    if (!template || selectedContacts.length === 0) return toast.error("Choose an approved template and at least one opted-in contact.");
    startTransition(async () => {
      try {
        const campaign = await createWhatsAppCampaign({ phoneNumberId, templateId, name, contactIds: selectedContacts, bodyParameters: parameters, scheduledAt: new Date(scheduledAt) });
        toast.success(`Notification scheduled for ${campaign.scheduledAt.toLocaleString()}`);
        setName("");
        setSelectedContacts([]);
        router.refresh();
        setSetup(await getWhatsAppNotificationSetup(phoneNumberId));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to schedule notification");
      }
    });
  }

  function cancelCampaign(campaignId: string) {
    startTransition(async () => {
      try {
        await cancelWhatsAppCampaign(campaignId);
        setSetup(await getWhatsAppNotificationSetup(phoneNumberId));
        toast.success("Campaign cancelled");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to cancel campaign");
      }
    });
  }

  return <div className="space-y-6">
    {setup.quota && <p className="text-sm text-muted-foreground">WhatsApp messages this billing period: {setup.quota.used} of {setup.quota.limit}</p>}
    <Card><CardHeader><CardTitle>Schedule customer notification</CardTitle></CardHeader><CardContent className="space-y-4">
      {setup.phoneNumbers.length === 0 ? <p className="text-sm text-muted-foreground">Connect and verify a WhatsApp number first.</p> : <>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="campaign-number">WhatsApp number</Label><select id="campaign-number" className="h-10 w-full rounded-md border bg-background px-3" value={phoneNumberId} onChange={(event) => void refresh(event.target.value)}>{setup.phoneNumbers.map((item) => <option key={item.id} value={item.id}>{item.displayName || item.phoneNumber} · {item.phoneNumber}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="campaign-template">Approved template</Label><select id="campaign-template" className="h-10 w-full rounded-md border bg-background px-3" value={templateId} onChange={(event) => { setTemplateId(event.target.value); setParameters([]); }}><option value="">Select a template</option>{setup.templates.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.language})</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="campaign-name">Campaign name</Label><Input id="campaign-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></div>
          <div className="space-y-2"><Label htmlFor="campaign-date">Send at (your browser timezone)</Label><Input id="campaign-date" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></div>
        </div>
        {requiredParameters > 0 && <div className="space-y-2"><Label>Template body values</Label>{Array.from({ length: requiredParameters }, (_, index) => <Input key={index} aria-label={`Template value ${index + 1}`} placeholder={`{{${index + 1}}}`} value={parameters[index] ?? ""} onChange={(event) => setParameters((current) => current.map((value, i) => i === index ? event.target.value : value).concat(current.length <= index ? [event.target.value] : []))} />)}</div>}
        <div className="space-y-2"><Label>Recipients with recorded consent ({eligible.length})</Label><div className="max-h-64 space-y-2 overflow-auto rounded-md border p-3">{setup.contacts.map((contact) => {
          const optedIn = Boolean(contact.whatsappOptInAt && !contact.whatsappOptOutAt);
          return <div key={contact.id} className="flex flex-wrap items-center gap-2 text-sm"><label className="flex min-w-64 flex-1 items-center gap-2"><input type="checkbox" disabled={!optedIn} checked={selectedContacts.includes(contact.id)} onChange={(event) => setSelectedContacts((current) => event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id))} /><span>{contact.name || contact.phoneNumber} · {contact.phoneNumber}</span></label><span className="text-muted-foreground">{optedIn ? `Opted in (${contact.whatsappOptInSource || "source not recorded"})` : contact.whatsappOptOutAt ? "Opted out" : "No consent recorded"}</span><Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => markConsent(contact.id, !optedIn)}>{optedIn ? "Record opt-out" : "Record consent"}</Button></div>;
        })}</div></div>
        <p className="text-xs text-muted-foreground">Only approved templates can be scheduled, and only contacts with recorded consent can be selected. Record consent only when the customer has actually opted in. Delivery requires the scheduled campaign worker to be invoked with CRON_SECRET.</p>
        <Button type="button" disabled={pending || !name.trim() || !template || selectedContacts.length === 0} onClick={submitCampaign}>{pending ? "Scheduling…" : "Schedule notification"}</Button>
      </>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Recent campaigns</CardTitle></CardHeader><CardContent className="space-y-2">{setup.campaigns.length ? setup.campaigns.map((campaign) => <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm"><span>{campaign.name} · {campaign._count.recipients} recipient(s) · {campaign.sentCount} sent · {campaign.failed.length} failed{campaign.failed.length > 0 ? ` (${campaign.failed.slice(0, 2).join("; ")})` : ""}</span><span className="flex items-center gap-2">{campaign.status} · {campaign.scheduledAt.toLocaleString()}{campaign.status === "SCHEDULED" && <Button size="sm" variant="outline" disabled={pending} onClick={() => cancelCampaign(campaign.id)}>Cancel</Button>}</span></div>) : <p className="text-sm text-muted-foreground">No campaigns yet.</p>}</CardContent></Card>
  </div>;
}
