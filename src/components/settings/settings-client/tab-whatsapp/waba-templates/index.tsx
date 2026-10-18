"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { BookOpen, MessageSquareText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Prisma, TemplateLibraryEntry } from "@/lib/prisma/generated";
import {
  createTemplateFromLibraryAction,
  getTemplateLibraryForUserAction,
} from "@/actions/template-library.actions";
import Loader from "@/components/ui/loaders";

type WabaWithAssets = Prisma.WabaAccountGetPayload<{
  include: { templates: true; phoneNumbers: true };
}> | null;
type LibraryData = Awaited<ReturnType<typeof getTemplateLibraryForUserAction>>;

export function TemplatesClient({
  wabaAccount,
}: {
  wabaAccount: WabaWithAssets;
}) {
  const [data, setData] = useState<LibraryData | null>(null);
  const [selected, setSelected] = useState<TemplateLibraryEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [componentsJson, setComponentsJson] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const library = await getTemplateLibraryForUserAction();
      console.log(library);
      setData(library);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load WhatsApp templates.";
      setLoadError(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = (entry: TemplateLibraryEntry) => {
    const usedNames = new Set(
      data?.templates.map((template) => template.name) ?? [],
    );
    let name = entry.key;
    let suffix = 2;
    while (usedNames.has(name)) name = `${entry.key}_${suffix++}`;
    setSelected(entry);
    setTemplateName(name);
    setComponentsJson(JSON.stringify(entry.components, null, 2));
    setDialogOpen(true);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    let components: unknown;
    if (data?.canCustomize) {
      try {
        components = JSON.parse(componentsJson);
      } catch {
        toast.error("Template components must be valid JSON.");
        return;
      }
    }
    startTransition(async () => {
      try {
        await createTemplateFromLibraryAction({
          libraryEntryId: selected.id,
          name: templateName.trim(),
          ...(data?.canCustomize ? { components } : {}),
        });
        toast.success("Template submitted to WhatsApp for review.");
        setDialogOpen(false);
        setSelected(null);
        await refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to create template.",
        );
      }
    });
  };

  const atLimit = Boolean(data && data.currentCount >= data.maxTemplates);

  return (
    <div className="space-y-6">
      {wabaAccount && data && (
        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>
              Templates are available for customer notifications after Meta
              approves them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have not submitted any templates yet.
              </p>
            ) : (
              <div className="space-y-2">
                {data.templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.category} · {template.language}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        template.status === "APPROVED"
                          ? "default"
                          : template.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {template.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Template library</CardTitle>
              <CardDescription>
                Start with a curated template and submit it to Meta for
                approval.
              </CardDescription>
            </div>
            {data && (
              <Badge variant={atLimit ? "destructive" : "secondary"}>
                {data.currentCount} /{" "}
                {data.maxTemplates >= 999 ? "∞" : data.maxTemplates} templates
                used
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadError ? (
            <div className="rounded-md border p-6 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => void refresh()}
              >
                Try again
              </Button>
            </div>
          ) : !wabaAccount ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No Whatsapp Business account linked
            </p>
          ) : data === null ? (
            <Loader />
          ) : (
            <>
              {!data.hasActiveSubscription && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  An active subscription is required.
                </p>
              )}
              {atLimit && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  You’ve reached your plan’s template limit. Upgrade your plan
                  or remove a template before creating another.
                </p>
              )}
              {data.entries.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No templates are available for your plan yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{entry.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {entry.description ||
                              `${entry.category} · ${entry.language}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="outline">{entry.category}</Badge>
                        <Button
                          size="sm"
                          onClick={() => openCreate(entry)}
                          disabled={atLimit || !data.hasActiveSubscription}
                        >
                          <Plus className="h-4 w-4" />
                          Use template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create from {selected?.name}</DialogTitle>
            <DialogDescription>
              This submits a template to Meta for review. Meta approval is
              required before it can be used for notifications.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-template-name">
                  WhatsApp template name
                </Label>
                <Input
                  id="user-template-name"
                  value={templateName}
                  onChange={(event) =>
                    setTemplateName(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    )
                  }
                  pattern="[a-z0-9_]+"
                  required
                  maxLength={512}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-template-components">
                  Template components (JSON)
                </Label>
                <Textarea
                  id="user-template-components"
                  value={componentsJson}
                  onChange={(event) => setComponentsJson(event.target.value)}
                  rows={12}
                  readOnly={!data?.canCustomize}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {data?.canCustomize
                    ? "You can customize these components for this submission. This does not save a reusable blueprint."
                    : "This plan uses manager-curated templates as provided."}
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting…" : "Submit template"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
