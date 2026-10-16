"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckCircleIcon, ClockIcon, EditIcon, EyeIcon, PlusIcon, RefreshCwIcon, SearchIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { Prisma, TemplateApprovalStatus, TemplateCategory, TemplateLanguage, WabaTemplate } from "@/lib/prisma/generated";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/ui/loaders";
import TemplateForm from "@/components/settings/settings-client/tab-whatsapp/waba-templates/form";
import { deleteWabaTemplateAction, findWabaTemplatesAction, synchronizeMeta, updateWabaTemplateAction } from "./actions";
import toast from "react-hot-toast";
import { ConfirmActionDialog } from "./confirm-action-dialog";

type DialogState = { kind: "create" } | { kind: "view" | "edit" | "delete"; template: WabaTemplate } | null;

const statusIcon = {
  APPROVED: <CheckCircleIcon className="mr-1 h-3 w-3" />,
  PENDING: <ClockIcon className="mr-1 h-3 w-3" />,
  REJECTED: <XCircleIcon className="mr-1 h-3 w-3" />,
  DISABLED: <ClockIcon className="mr-1 h-3 w-3" />,
};

export default function TabTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<WabaTemplate[] | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setTemplates(await findWabaTemplatesAction());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load templates.");
      setTemplates([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = (templates ?? []).filter((template) =>
    `${template.name} ${template.category} ${template.language} ${template.status}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const saveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog || dialog.kind !== "edit") return;
    const form = new FormData(event.currentTarget);
    let components: Prisma.InputJsonValue;
    try {
      components = JSON.parse(String(form.get("components") ?? "[]"));
    } catch {
      toast.error("Components must be valid JSON.");
      return;
    }
    const data = {
      name: String(form.get("name") ?? "").trim(),
      category: String(form.get("category")) as TemplateCategory,
      language: String(form.get("language")) as TemplateLanguage,
      components,
    };
    startTransition(async () => {
      try {
        await updateWabaTemplateAction(dialog.template.id, data);
        toast.success("Local template record updated.");
        setDialog(null);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update template.");
      }
    });
  };

  const removeTemplate = () => {
    if (!dialog || dialog.kind !== "delete") return;
    const template = dialog.template;
    startTransition(async () => {
      try {
        await deleteWabaTemplateAction(template.id);
        toast.success(`Template “${template.name}” deleted.`);
        setDialog(null);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete template.");
      }
    });
  };

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      await synchronizeMeta();
      toast.success("WhatsApp templates synchronized.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to synchronize templates.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <TabsContent value="templates" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div><CardTitle>Message Templates</CardTitle><CardDescription>Manage WhatsApp templates and sync their status with Meta Cloud API.</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={syncTemplates} disabled={syncing}><RefreshCwIcon className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Sync from Meta</Button>
              <Button onClick={() => setDialog({ kind: "create" })}><PlusIcon className="h-4 w-4" />New Template</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4"><SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search templates..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" /></div>
          {templates === null ? <Loader /> : templates.length === 0 ? <p className="rounded-md border p-8 text-center text-sm text-muted-foreground">No templates yet. Create a template to submit it to WhatsApp for review.</p> : filtered.length === 0 ? <p className="rounded-md border p-8 text-center text-sm text-muted-foreground">No templates match your search.</p> : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50 text-left text-sm"><th className="px-4 py-3">Template name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Language</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last updated</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody>{filtered.map((template) => <tr key={template.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{template.name}</td><td className="px-4 py-3"><Badge variant="outline">{template.category}</Badge></td><td className="px-4 py-3 text-sm">{template.language}</td>
                  <td className="px-4 py-3"><Badge variant={template.status === TemplateApprovalStatus.APPROVED ? "default" : template.status === TemplateApprovalStatus.REJECTED ? "destructive" : "secondary"}>{statusIcon[template.status]}{template.status}</Badge></td>
                  <td className="px-4 py-3 text-sm">{template.updatedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" aria-label={`View ${template.name}`} title="View" onClick={() => setDialog({ kind: "view", template })}><EyeIcon /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${template.name}`} title="Edit local record" onClick={() => setDialog({ kind: "edit", template })}><EditIcon /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${template.name}`} title="Delete" onClick={() => setDialog({ kind: "delete", template })}><Trash2Icon /></Button>
                  </div></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog?.kind === "create"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Create WhatsApp template</DialogTitle><DialogDescription>Build and submit a template for Meta approval.</DialogDescription></DialogHeader>
          <TemplateForm onCreated={() => { setDialog(null); void refresh(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog?.kind === "view"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {dialog?.kind === "view" && <><DialogHeader><DialogTitle>{dialog.template.name}</DialogTitle><DialogDescription>WhatsApp template details</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-4 text-sm"><div><Label>Category</Label><p className="mt-1">{dialog.template.category}</p></div><div><Label>Language</Label><p className="mt-1">{dialog.template.language}</p></div><div><Label>Status</Label><p className="mt-1">{dialog.template.status}</p></div><div><Label>Updated</Label><p className="mt-1">{dialog.template.updatedAt.toLocaleString()}</p></div></div>
            {dialog.template.rejectedReason && <div><Label>Meta feedback</Label><p className="mt-1 text-sm text-destructive">{dialog.template.rejectedReason}</p></div>}
            <div><Label>Components</Label><pre className="mt-1 max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(dialog.template.components, null, 2)}</pre></div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog?.kind === "edit"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {dialog?.kind === "edit" && <><DialogHeader><DialogTitle>Edit local template record</DialogTitle><DialogDescription>Meta does not support editing a submitted template in place. These changes update Loci’s local record only; create a new template to change what WhatsApp sends.</DialogDescription></DialogHeader>
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="template-name">Name</Label><Input id="template-name" name="name" defaultValue={dialog.template.name} required maxLength={512} /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Category</Label><Select name="category" defaultValue={dialog.template.category}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.values(TemplateCategory).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Language</Label><Select name="language" defaultValue={dialog.template.language}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.values(TemplateLanguage).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></div>
              <div className="space-y-2"><Label htmlFor="template-components">Components (JSON)</Label><Textarea id="template-components" name="components" defaultValue={JSON.stringify(dialog.template.components, null, 2)} rows={10} className="font-mono text-xs" required /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save local changes"}</Button></DialogFooter>
            </form>
          </>}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Delete template?"
        description={dialog?.kind === "delete" ? `This will remove “${dialog.template.name}” from Loci. WhatsApp templates are not deleted from Meta, and templates used by scheduled campaigns cannot be removed.` : ""}
        confirmLabel="Delete template"
        pending={isPending}
        onConfirm={removeTemplate}
      />
    </TabsContent>
  );
}
