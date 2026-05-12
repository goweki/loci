"use client";

import { useMemo, useState } from "react";
import { Search, User, Check, CheckCheck, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { InputWithIcon } from "@/components/ui/input";

import type { ConversationDTO } from "@/services/conversation";

type ConversationsComponentProps = {
  initialConversations: ConversationDTO[] | null;
  error: string | null;
};

export function ConversationsComponent({
  initialConversations,
  error,
}: ConversationsComponentProps) {
  const [search, setSearch] = useState("");

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(
    initialConversations?.length && initialConversations?.length > 0
      ? initialConversations[0]?.id
      : null,
  );

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
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-semibold">
              {selectedConversation.name}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {selectedConversation.phone}
            </p>

            <p className="mt-6 text-sm text-muted-foreground">
              Select a conversation to start messaging
            </p>
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
