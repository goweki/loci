"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/loaders";
import { AutoReplyRule, TriggerType } from "@/lib/prisma/generated";
import { getAllAutoReplyRules, deleteAutoReplyRule, setAutoReplyRuleActive } from "@/actions/autoReplyRule.actions";
import { getChatbotSetup } from "@/actions/chatbot.actions";
import { useCallback, useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { AutoReplyRuleDialogue, NewAutoReplyRuleDialogue } from "./forms";

type Phone = { id: string; phoneNumber: string; displayName: string | null };
type Rule = AutoReplyRule & { phoneNumber: Phone };

export default function TabAutoreplyRules() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const [loadedRules, setup] = await Promise.all([getAllAutoReplyRules(), getChatbotSetup()]);
      setRules(loadedRules as Rule[]);
      setPhones(setup.map(({ id, phoneNumber, displayName }) => ({ id, phoneNumber, displayName })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load rules");
      setRules([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const toggle = (rule: Rule) => startTransition(async () => {
    try {
      await setAutoReplyRuleActive(rule.id, !rule.isActive);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update rule");
    }
  });

  const remove = (rule: Rule) => {
    if (!window.confirm(`Delete “${rule.name}”?`)) return;
    startTransition(async () => {
      try {
        await deleteAutoReplyRule(rule.id);
        toast.success("Rule deleted");
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete rule");
      }
    });
  };

  if (!rules) return <Loader />;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Auto Reply Rules</CardTitle>
            <CardDescription>Deterministic replies run before the AI assistant for the selected WhatsApp number.</CardDescription>
          </div>
          <NewRuleAction />
        </div>
      </CardHeader>
      <CardContent>
        {phones.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">Connect a WhatsApp number before creating rules.</p>
        ) : rules.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">No auto-reply rules yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm">
                <th className="px-4 py-3">Rule name</th><th className="px-4 py-3">Trigger</th><th className="px-4 py-3">WhatsApp number</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody>{rules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{rule.name}</td>
                  <td className="px-4 py-3 text-sm"><Badge variant="outline">{rule.triggerType === TriggerType.DEFAULT ? "Default" : `${rule.triggerType}${rule.triggerValue ? `: ${rule.triggerValue}` : ""}`}</Badge></td>
                  <td className="px-4 py-3 text-sm">{rule.phoneNumber.displayName || rule.phoneNumber.phoneNumber}</td>
                  <td className="px-4 py-3 text-sm">{rule.priority}</td>
                  <td className="px-4 py-3"><Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <AutoReplyRuleDialogue phoneNumbers={phones} rule={rule} onSaved={() => void refresh()} />
                    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => toggle(rule)}>{rule.isActive ? "Pause" : "Activate"}</Button>
                    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => remove(rule)}>Delete</Button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  function NewRuleAction() {
    return <NewAutoReplyRuleDialogue phoneNumbers={phones} onSaved={() => void refresh()} />;
  }
}
