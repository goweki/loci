"use client";

import { getChatbotSetup, saveChatbotConfig } from "@/actions/chatbot.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Setup = Awaited<ReturnType<typeof getChatbotSetup>>[number];

function createPrompt() {
  return [
    "You are the WhatsApp assistant for the person or business described below.",
    "Be helpful, concise, and professional. Reply in the language used by the customer when practical.",
    "Use only the supplied profile and enabled tools as sources of facts. Never invent services, product details, prices, stock, policies, or commitments.",
    "If you cannot answer confidently, ask a brief clarifying question or offer a human handoff.",
  ].join("\n");
}

export function AssistantConfig() {
  const [setup, setSetup] = useState<Setup[]>([]);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [profile, setProfile] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [handoffKeywords, setHandoffKeywords] = useState("human, agent, representative");
  const [catalogueEnabled, setCatalogueEnabled] = useState(false);
  const [assistantActive, setAssistantActive] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getChatbotSetup().then((result) => {
      setSetup(result);
      if (result[0]) setPhoneNumberId(result[0].id);
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to load assistant settings");
    });
  }, []);

  const selected = setup.find((number) => number.id === phoneNumberId);
  useEffect(() => {
    const config = selected?.chatbotConfig;
    setSystemPrompt(config?.systemPrompt ?? "");
    setProfile(config?.profileContext ?? "");
    setHandoffKeywords(config?.humanHandoffKeywords.join(", ") ?? "human, agent, representative");
    setCatalogueEnabled(config?.enabledTools.includes("search_catalogue") ?? false);
    setAssistantActive(config?.isActive ?? false);
  }, [selected]);

  const save = () => startTransition(async () => {
    try {
      await saveChatbotConfig({
        phoneNumberId,
        systemPrompt,
        profileContext: profile,
        isActive: assistantActive,
        enabledTools: catalogueEnabled ? ["search_catalogue"] : [],
        temperature: selected?.chatbotConfig?.temperature ?? 0.4,
        maxTokens: selected?.chatbotConfig?.maxTokens ?? 800,
        humanHandoffKeywords: handoffKeywords.split(",").map((value) => value.trim()).filter(Boolean),
        conversationHistory: selected?.chatbotConfig?.conversationHistory ?? 10,
        resetContextAfter: selected?.chatbotConfig?.resetContextAfter ?? 30,
      });
      toast.success("Assistant settings saved");
      const refreshed = await getChatbotSetup();
      setSetup(refreshed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save assistant settings");
    }
  });

  if (setup.length === 0) {
    return <Card><CardHeader><CardTitle>AI assistant</CardTitle><CardDescription>Connect a WhatsApp number before configuring an assistant.</CardDescription></CardHeader></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI assistant</CardTitle>
        <CardDescription>Configure an assistant per number. Profile text is saved in its system prompt; catalogue access is an optional read-only capability.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="assistant-number">WhatsApp number</Label>
          <Select value={phoneNumberId} onValueChange={setPhoneNumberId}>
            <SelectTrigger id="assistant-number"><SelectValue placeholder="Select a number" /></SelectTrigger>
            <SelectContent>{setup.map((number) => <SelectItem key={number.id} value={number.id}>{number.displayName || number.phoneNumber} · {number.phoneNumber}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistant-profile">Company/personal profile or CV text</Label>
          <Textarea id="assistant-profile" value={profile} onChange={(event) => setProfile(event.target.value)} rows={7} maxLength={10000} placeholder="Describe the person or organization, services, hours, location, policies, and common questions. You may paste reviewed CV/profile text here." />
          <Button type="button" variant="outline" onClick={() => setSystemPrompt(createPrompt())}>Generate prompt draft</Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistant-prompt">System prompt</Label>
          <Textarea id="assistant-prompt" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} rows={10} maxLength={12000} placeholder="Generate a draft above or write the assistant instructions here." />
          <p className="text-xs text-muted-foreground">Review and edit the prompt before activation. Uploaded files are not ingested automatically; paste only content you want the assistant to use.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistant-handoff">Human handoff keywords</Label>
          <input id="assistant-handoff" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={handoffKeywords} onChange={(event) => setHandoffKeywords(event.target.value)} placeholder="human, agent, representative" />
          <p className="text-xs text-muted-foreground">Separate phrases with commas. A matching inbound message pauses the assistant for that conversation.</p>
        </div>

        <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <input type="checkbox" checked={catalogueEnabled} onChange={(event) => setCatalogueEnabled(event.target.checked)} className="mt-0.5" />
          <span><span className="font-medium">Allow read-only catalogue search</span><span className="mt-1 block text-muted-foreground">The assistant can look up active products owned by this account and use current listed prices and stock quantities. It cannot create orders, change stock, or take payments.</span></span>
        </label>

        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={assistantActive} onChange={(event) => setAssistantActive(event.target.checked)} /> Activate assistant after saving</label>
        <div className="flex justify-end"><Button onClick={save} disabled={isPending || !phoneNumberId || systemPrompt.trim().length < 20}>{isPending ? "Saving…" : "Save assistant"}</Button></div>
      </CardContent>
    </Card>
  );
}
