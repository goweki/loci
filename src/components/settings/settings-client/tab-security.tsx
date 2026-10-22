"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/loaders";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckIcon,
  CopyIcon,
  KeyIcon,
  PlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { datetimeStamp } from "@/lib/utils/dateHandlers";
import { ApiKey } from "@/actions/api-key.actions/api-key.actions.dto";
import {
  generateUserApiKey,
  getUserApiKeys,
  revokeApiKey,
} from "@/actions/api-key.actions";
import {
  requestCurrentUserAccountDeletion,
  sendCurrentUserPasswordSetupLink,
} from "@/actions/user.actions";
import { useI18n } from "@/lib/i18n";

export function TabSecurity({
  hasPassword,
  accountEmail,
}: {
  hasPassword: boolean;
  accountEmail: string | null;
}) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>();
  const [sendingPasswordLink, setSendingPasswordLink] = useState(false);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [deletionEmail, setDeletionEmail] = useState("");
  const [sendingDeletionRequest, setSendingDeletionRequest] = useState(false);
  const { data: session } = useSession();
  const { language } = useI18n();

  const requestPasswordLink = async () => {
    setSendingPasswordLink(true);
    try {
      const result = await sendCurrentUserPasswordSetupLink(language);
      if (!result.ok) throw new Error(result.error);
      toast.success("Password link sent. Check your account email.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send password link.",
      );
    } finally {
      setSendingPasswordLink(false);
    }
  };

  const submitDeletionRequest = async () => {
    setSendingDeletionRequest(true);
    try {
      const result = await requestCurrentUserAccountDeletion(deletionEmail);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        language === "sw"
          ? "Ombi la kufuta akaunti limetumwa."
          : "Your account deletion request has been sent.",
      );
      setDeletionEmail("");
      setDeletionDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send your account deletion request.",
      );
    } finally {
      setSendingDeletionRequest(false);
    }
  };

  const fetchApiKeys = useCallback(async () => {
    if (!session?.user.id) return;
    const _apiKeys = await getUserApiKeys();
    setApiKeys(_apiKeys);
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchApiKeys();
    }
  }, [session?.user, fetchApiKeys]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {hasPassword ? "Change password" : "Set a password"}
          </CardTitle>
          <CardDescription>
            We&apos;ll email a secure, one-time link to{" "}
            {session?.user.email || "your account email"}. You can open it even
            if you have signed out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={requestPasswordLink}
            disabled={sendingPasswordLink || !session?.user.email}
          >
            {sendingPasswordLink ? (
              <Loader />
            ) : hasPassword ? (
              "Send password change link"
            ) : (
              "Set password"
            )}
          </Button>
          {!session?.user.email && (
            <p className="mt-2 text-sm text-destructive">
              Add an email address to your account before setting a password.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-primary" />
                API Access Key
              </CardTitle>
              <CardDescription>
                Use this key to authenticate your requests to our API.
                Generating a new key will log you out of existing mobile logins
                and invalidate any existing key
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiKeys ? (
            <ApiKeySection existingKeys={apiKeys} refreshKeys={fetchApiKeys} />
          ) : (
            <Loader />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            {language === "sw"
              ? "Omba kufutwa kwa akaunti yako ya Loci na data inayohusishwa nayo. Tutathibitisha umiliki na kushughulikia ombi lako ndani ya siku 30."
              : "Request deletion of your Loci account and associated data. We will verify account ownership and process your request within 30 days."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <Button
            variant="destructive"
            onClick={() => setDeletionDialogOpen(true)}
          >
            {language === "sw"
              ? "Omba kufutwa kwa akaunti"
              : "Request account deletion"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {language === "sw"
              ? "Thibitisha barua pepe ya akaunti yako ili utume ombi. Tutathibitisha umiliki na kushughulikia ombi lako ndani ya siku 30."
              : "Confirm your account email to send a request. We will verify account ownership and process your request within 30 days."}
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={deletionDialogOpen}
        onOpenChange={(open) => {
          if (sendingDeletionRequest) return;
          setDeletionDialogOpen(open);
          if (!open) setDeletionEmail("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "sw"
                ? "Thibitisha ombi la kufuta akaunti"
                : "Confirm account deletion request"}
            </DialogTitle>
            <DialogDescription>
              {language === "sw"
                ? `Weka barua pepe ya akaunti yako${accountEmail ? ` (${accountEmail})` : ""} ili kutuma ombi lako kwa timu yetu. Akaunti yako haitafutwa mara moja.`
                : `Enter your account email${accountEmail ? ` (${accountEmail})` : ""} to send your request to our team. Your account will not be deleted immediately.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deletion-confirmation-email">
              {language === "sw" ? "Barua pepe ya akaunti" : "Account email"}
            </Label>
            <Input
              id="deletion-confirmation-email"
              type="email"
              autoComplete="email"
              value={deletionEmail}
              onChange={(event) => setDeletionEmail(event.target.value)}
              placeholder={accountEmail || "name@example.com"}
              disabled={sendingDeletionRequest}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletionDialogOpen(false)}
              disabled={sendingDeletionRequest}
            >
              {language === "sw" ? "Ghairi" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={submitDeletionRequest}
              disabled={
                sendingDeletionRequest ||
                !accountEmail ||
                deletionEmail.trim().toLowerCase() !==
                  accountEmail.trim().toLowerCase()
              }
            >
              {sendingDeletionRequest
                ? language === "sw"
                  ? "Inatuma..."
                  : "Sending..."
                : language === "sw"
                  ? "Tuma ombi"
                  : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function ApiKeySection({
    existingKeys,
    refreshKeys,
  }: {
    existingKeys: ApiKey[];
    refreshKeys: Function;
  }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
      if (!newKeyName) return toast.error("Please provide a name for the key");
      if (!session?.user.id) return;

      setIsGenerating(true);
      try {
        const rawKey = await generateUserApiKey(newKeyName);
        setRevealedKey(rawKey);
        toast.success("API Key generated successfully");
      } catch (err) {
        toast.error("Failed to generate key");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = async (id: string) => {
      if (!confirm("Are you sure? This action cannot be undone.")) return;
      try {
        const resRevoke = await revokeApiKey(id);
        if (!resRevoke.ok) {
          toast.error(resRevoke.error);
          return;
        }

        toast.success(`Key revoked`);

        refreshKeys();
      } catch (err) {
        toast.error("Failed to revoke key");
      }
    };

    return (
      <>
        {/* Step 1: Reveal Key (One-time view) */}
        {revealedKey ? (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between">
              <Label className="text-primary font-bold flex items-center gap-2">
                <CheckIcon className="h-4 w-4" /> Save your key now
              </Label>
              <Badge variant="outline" className="bg-background">
                One-time view
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              For security, we cannot show this key again. Copy it and store it
              in a safe place.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={revealedKey}
                className="font-mono bg-background border-primary/30"
              />
              <Button size="icon" onClick={() => handleCopy(revealedKey)}>
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full text-xs"
              onClick={() => {
                setRevealedKey(null);
                setNewKeyName("");
                refreshKeys();
              }}
            >
              I have saved my key
            </Button>
          </div>
        ) : (
          /* Step 2: Generate Interface */
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Key Name (e.g. Production Server)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? <Loader /> : <PlusIcon className="h-4 w-4" />}
              Generate Key
            </Button>
          </div>
        )}

        <Separator />

        {/* Step 3: List & Revoke */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Active Keys</h3>
          {existingKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No active API keys found.
            </p>
          ) : (
            <div className="space-y-3">
              {existingKeys.map((key) => (
                <div
                  key={key.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${!key.isActive ? "bg-muted/20 opacity-75" : "bg-card hover:bg-muted/20 border"} transition-colors`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tracking-tight">
                        {key.description}
                      </span>
                      <Badge
                        variant={
                          !key.isActive || key.expiresAt < new Date()
                            ? "secondary"
                            : "default"
                        }
                        className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {key.expiresAt < new Date()
                          ? "Expired"
                          : key.isActive
                            ? "Active"
                            : "Revoked"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <time dateTime={key.createdAt.toISOString()}>
                        Created on{" "}
                        {new Date(key.createdAt).toLocaleDateString()}
                      </time>

                      <span className="text-muted-foreground/40">•</span>
                      <time
                        dateTime={key.expiresAt.toISOString()}
                        className="italic"
                      >
                        Expires {datetimeStamp(key.expiresAt)}
                      </time>
                    </div>
                  </div>

                  <Button
                    variant={"destructive"}
                    size="sm"
                    disabled={!key.isActive}
                    onClick={() => handleRevoke(key.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }
}
