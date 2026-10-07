"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, User, Check, CheckCheck, Clock, PlusIcon, Send } from "lucide-react";

import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { InputWithIcon } from "@/components/ui/input";

import type { ConversationDTO } from "@/services/conversation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { NewMessageDialog } from "./new-message-dialog";
import { sendConversationTextAction, setAssistantHandoffAction } from "@/actions/conversation.actions";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent } from "react";

type ConversationsComponentProps = {
  initialConversations: ConversationDTO[] | null;
  error: string | null;
};

export function ConversationsComponent({
  initialConversations,
  error,
}: ConversationsComponentProps) {
  const { language } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dialog = searchParams.get("dialog");

  const [search, setSearch] = useState("");

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(
    initialConversations?.length && initialConversations?.length > 0
      ? initialConversations[0]?.id
      : null,
  );

  const [newDialogOpen, setNewDialogOpen] = useState<boolean>(
    dialog === "new-message",
  );
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");

  const conversations = useMemo(() => {
    if (!search.trim()) {
      return initialConversations;
    }

    const query = search.toLowerCase();

    return initialConversations?.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(query) ||
        conversation.phone.includes(query),
    );
  }, [initialConversations, search]);

  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId,
  );

  function renderStatusIcon(status?: string) {
    switch (status) {
      case "SENT":
        return <Check className="h-4 w-4 text-muted-foreground" />;

      case "DELIVERED":
        return <CheckCheck className="h-4 w-4 text-muted-foreground" />;

      case "READ":
        return <CheckCheck className="h-4 w-4 text-primary" />;

      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  }

  function onSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversation?.phoneNumberId || !draft.trim()) return;
    const messageText = draft;
    startTransition(async () => {
      const result = await sendConversationTextAction(
        selectedConversation.id,
        selectedConversation.phoneNumberId!,
        messageText,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDraft("");
      toast.success("Message sent");
      router.refresh();
    });
  }

  function messageText(content: unknown) {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      const value = content as { text?: unknown; caption?: unknown; filename?: unknown };
      if (typeof value.text === "string") return value.text;
      if (typeof value.caption === "string") return value.caption;
      if (typeof value.filename === "string") return `Document: ${value.filename}`;
    }
    return "Media message";
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden">
      {/* Sidebar */}
      <Card className="flex w-96 flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Conversations</h1>

            <p className="text-sm text-muted-foreground">
              Manage your WhatsApp conversations
            </p>
          </div>
          <Button className="mb-4" onClick={() => setNewDialogOpen(true)}>
            <PlusIcon /> New Message
          </Button>
          <NewMessageDialog open={newDialogOpen} setOpen={setNewDialogOpen} />

          <InputWithIcon
            icon={Search}
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {!conversations ? (
            <div className="italic">
              {error || "Error fetching conversations"}
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className={cn(
                  "w-full border-b p-4 text-left transition-colors hover:bg-accent/50",
                  selectedConversationId === conversation.id && "bg-accent/30",
                )}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {conversation.name?.charAt(0)?.toUpperCase() || (
                      <User className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold">
                        {conversation.name}
                      </h3>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {conversation.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {conversation.direction === "OUTBOUND" &&
                        renderStatusIcon(conversation.status)}

                      <p className="truncate text-sm text-muted-foreground">
                        {conversation.message}
                      </p>
                    </div>
                  </div>

                  {/* Unread */}
                  {conversation.unread > 0 && (
                    <div className="flex items-start">
                      <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                        {conversation.unread}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <div className="flex flex-1 items-center justify-center bg-background">
        {selectedConversation ? (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h2 className="font-semibold">{selectedConversation.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedConversation.phone}</p>
              </div>
            {selectedConversation.chatbot && selectedConversation.phoneNumberId && (
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">{selectedConversation.chatbot.handedOff ? "Human takeover" : selectedConversation.chatbot.active ? "Assistant active" : "Assistant paused"}</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => startTransition(async () => {
                    const result = await setAssistantHandoffAction(
                      selectedConversation.id,
                      selectedConversation.phoneNumberId!,
                      !selectedConversation.chatbot?.handedOff,
                    );
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success(result.data.handedOffToHuman ? "Assistant paused for this conversation" : "Assistant resumed");
                    router.refresh();
                  })}
                >
                  {selectedConversation.chatbot.handedOff ? "Resume assistant" : "Take over"}
                </Button>
              </div>
            )}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {selectedConversation.messages
                .filter((message) => !selectedConversation.phoneNumberId || message.phoneNumberId === selectedConversation.phoneNumberId)
                .map((message) => (
                  <div key={message.id} className={`flex ${message.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.direction === "OUTBOUND" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="whitespace-pre-wrap text-sm">{messageText(message.content)}</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                        <time>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                        {message.direction === "OUTBOUND" && renderStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <form onSubmit={onSend} className="flex items-end gap-2 border-t p-4">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={4000} placeholder="Reply in WhatsApp…" disabled={isPending || !selectedConversation.phoneNumberId} />
              <Button type="submit" disabled={isPending || !draft.trim() || !selectedConversation.phoneNumberId} size="icon" aria-label="Send message"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>

            <h3 className="text-xl font-semibold">No conversation selected</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Choose a conversation from the sidebar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
