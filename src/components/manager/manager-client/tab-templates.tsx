"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { EditIcon, PlusIcon, Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TemplateCategory, TemplateLanguage, TemplateLibraryEntry } from "@/lib/prisma/generated";
import {
  createTemplateLibraryEntryAction,
  deleteTemplateLibraryEntryAction,
  getTemplateLibraryForManagerAction,
  updateTemplateLibraryEntryAction,
} from "@/actions/template-library.actions";
import { ConfirmActionDialog } from "./confirm-action-dialog";
import Loader from "@/components/ui/loaders";

type EntryDraft = {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  components: string;
  isDefault: boolean;
  isActive: boolean;
};

const emptyDraft: EntryDraft = {
  key: "",
  name: "",
  description: "",
  category: TemplateCategory.UTILITY,
  language: TemplateLanguage.en_US,
  components: JSON.stringify([{ type: "BODY", text: "Hello {{1}}" }], null, 2),
  isDefault: false,
  isActive: true,
};

function toDraft(entry?: TemplateLibraryEntry): EntryDraft {
  return entry ? {
    key: entry.key,
    name: entry.name,
    description: entry.description ?? "",
    category: entry.category,
    language: entry.language,
    components: JSON.stringify(entry.components, null, 2),
    isDefault: entry.isDefault,
    isActive: entry.isActive,
  } : emptyDraft;
}

export default function TabTemplates() {
  const [entries, setEntries] = useState<TemplateLibraryEntry[] | null>(null);
  const [editing, setEditing] = useState<TemplateLibraryEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<TemplateLibraryEntry | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      setEntries(await getTemplateLibraryForManagerAction());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load the template library.");
      setEntries([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  };

  const openEdit = (entry: TemplateLibraryEntry) => {
    setEditing(entry);
    setDraft(toDraft(entry));
    setDialogOpen(true);
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let components: unknown;
    try {
      components = JSON.parse(draft.components);
    } catch {
      toast.error("Template components must be valid JSON.");
      return;
    }
    const input = { ...draft, components };
    startTransition(async () => {
      try {
        if (editing) await updateTemplateLibraryEntryAction(editing.id, input);
        else await createTemplateLibraryEntryAction(input);
        toast.success(editing ? "Library template updated." : "Library template created.");
        setDialogOpen(false);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save the library template.");
      }
    });
  };

  const remove = () => {
    if (!deleting) return;
    startTransition(async () => {
      try {
        await deleteTemplateLibraryEntryAction(deleting.id);
        toast.success("Library template deleted.");
        setDeleting(null);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete the library template.");
      }
    });
  };

  return (
    <TabsContent value="templates" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Template creation library</CardTitle>
              <CardDescription>Curate reusable WhatsApp template JSON for businesses. Mark entries as defaults for restricted plans; plans with customization enabled can edit components for an individual submission.</CardDescription>
            </div>
            <Button onClick={openCreate}><PlusIcon className="h-4 w-4" />Add library template</Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries === null ? <Loader /> : entries.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">The library is empty. Add a template blueprint to make it available in Settings.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50 text-left text-sm"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Key</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody>{entries.map((entry) => <tr key={entry.id} className="border-b last:border-0">
                  <td className="px-4 py-3"><p className="font-medium">{entry.name}</p>{entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.key}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{entry.category}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={entry.isDefault ? "secondary" : "outline"}>{entry.isDefault ? "Default plans" : "Customization plans"}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={entry.isActive ? "default" : "secondary"}>{entry.isActive ? "Active" : "Archived"}</Badge></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${entry.name}`} onClick={() => openEdit(entry)}><EditIcon /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${entry.name}`} onClick={() => setDeleting(entry)}><Trash2Icon /></Button></div></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit library template" : "Add library template"}</DialogTitle><DialogDescription>Use Meta template component JSON. Users get a copy of this blueprint when they create a template.</DialogDescription></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="library-key">Template key</Label><Input id="library-key" value={draft.key} onChange={(event) => setDraft({ ...draft, key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="appointment_reminder" required maxLength={128} /></div>
              <div className="space-y-2"><Label htmlFor="library-name">Display name</Label><Input id="library-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={120} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="library-description">Description</Label><Input id="library-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={500} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Category</Label><Select value={draft.category} onValueChange={(category) => setDraft({ ...draft, category: category as TemplateCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.values(TemplateCategory).map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Language</Label><Select value={draft.language} onValueChange={(language) => setDraft({ ...draft, language: language as TemplateLanguage })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.values(TemplateLanguage).map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="library-components">Components JSON</Label><Textarea id="library-components" value={draft.components} onChange={(event) => setDraft({ ...draft, components: event.target.value })} rows={14} className="font-mono text-xs" required /><p className="text-xs text-muted-foreground">For variable text, use Meta placeholders such as {'{{1}}'} and provide matching examples in the BODY component.</p></div>
            <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })} />Available on default plans</label><label className="flex items-center gap-2"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />Available to users</label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={isPending}>{isPending ? "Saving…" : editing ? "Save changes" : "Create blueprint"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete library template?" description={deleting ? `“${deleting.name}” will no longer be available for new submissions. Templates already created by users are not affected.` : ""} confirmLabel="Delete blueprint" pending={isPending} onConfirm={remove} />
    </TabsContent>
  );
}
