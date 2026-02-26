"use-client";

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
import { ApiKey, Prisma } from "@/lib/prisma/generated";
import {
  CheckIcon,
  CopyIcon,
  KeyIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  _revokeApiKey,
  generateUserApiKey,
  getUserApiKeys,
  MinimalApiKey,
} from "./_actions";
import { useSession } from "next-auth/react";
import { dateLong, datetimeStamp } from "@/lib/utils/dateHandlers";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function TabSecurity() {
  const [apiKeys, setApiKeys] = useState<MinimalApiKey[]>();
  const { data: session } = useSession();

  const fetchApiKeys = useCallback(async () => {
    if (!session?.user.id) return;
    const _apiKeys = await getUserApiKeys(session.user.id);
    setApiKeys(_apiKeys);
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchApiKeys();
    }
  }, [session?.user]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Choose how you&apos;d like to receive your password recovery link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RequestPasswordReset />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-primary" />
                API Access Keys
              </CardTitle>
              <CardDescription>
                Use these keys to authenticate your requests to our API.
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
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <Button disabled={true} variant="destructive">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </>
  );

  function RequestPasswordReset() {
    const [method, setMethod] = useState("email");

    return (
      <div className="space-y-3">
        {/* Compact Method Selection */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Reset Method
          </Label>
          <RadioGroup
            defaultValue="email"
            onValueChange={setMethod}
            className="flex p-1 bg-muted rounded-lg max-w-md"
          >
            {[
              { id: "email", label: "Email", icon: MailIcon },
              { id: "sms", label: "SMS", icon: PhoneIcon },
              { id: "whatsapp", label: "WhatsApp", icon: MessageSquareIcon },
            ].map((item) => (
              <div key={item.id} className="flex-1">
                <RadioGroupItem
                  value={item.id}
                  id={item.id}
                  className="sr-only"
                />
                <Label
                  htmlFor={item.id}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    method === item.id
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="max-w-md">
          <div className="grid gri-col-1 md:grid-cols-3 space-x-4">
            {/* Inline Input with Icon */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  {method === "email" ? (
                    <MailIcon className="h-4 w-4" />
                  ) : (
                    <PhoneIcon className="h-4 w-4" />
                  )}
                </div>
                <Input
                  id="identifier"
                  type={method === "email" ? "email" : "tel"}
                  placeholder={
                    method === "email"
                      ? "Enter your email"
                      : "Enter phone number"
                  }
                  className="pl-9"
                />
              </div>
              <p className="text-[10px] text-muted-foreground px-1">
                Secure link will be sent via{" "}
                <span className="capitalize font-medium text-foreground">
                  {method}
                </span>
                .
              </p>
            </div>
            <Button disabled onClick={() => {}}>
              Send Reset Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function ApiKeySection({
    existingKeys,
    refreshKeys,
  }: {
    existingKeys: MinimalApiKey[];
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
        const rawKey = await generateUserApiKey(session?.user.id, newKeyName);
        // shown only once
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
        const delkeyName = await _revokeApiKey(id);
        toast.success(`Key revoked: ${delkeyName}`);
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
                        {key.name}
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
