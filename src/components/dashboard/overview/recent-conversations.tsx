import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  contactName?: string | null;
  phoneNumber: string;
  lastMessage: string;
  unreadCount?: number;
  lastMessageAt: Date;
}

interface RecentConversationsProps {
  conversations: Conversation[];
}

export function RecentConversations({
  conversations,
}: RecentConversationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Conversations</CardTitle>

        <CardDescription>Latest customer interactions</CardDescription>
      </CardHeader>

      <CardContent>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />

            <p className="font-medium">No conversations yet</p>

            <p className="text-sm text-muted-foreground">
              Customer messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>
                    {(conversation.contactName ?? conversation.phoneNumber)
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">
                      {conversation.contactName ?? conversation.phoneNumber}
                    </p>

                    {conversation.unreadCount ? (
                      <Badge variant="secondary">
                        {conversation.unreadCount}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.lastMessage}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(conversation.lastMessageAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
