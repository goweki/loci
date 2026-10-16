import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { ArrowRightIcon, MessageCircle } from "lucide-react";
import { BASE_URL } from "@/lib/utils/getUrl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Language } from "@/lib/i18n";

const dict = {
  en: { allConversations: "All Conversations" },
  sw: { allConversations: "Mazungumzo yote" },
};

interface Conversation {
  id: string;
  contactName?: string | null;
  phoneNumber: string;
  lastMessage: string;
  unreadCount?: number;
  lastMessageAt: Date;
}

interface RecentConversationsProps {
  lng: Language;
  conversations: Conversation[];
}

export function RecentConversations({
  lng,
  conversations,
}: RecentConversationsProps) {
  const t = dict[lng];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="space-x-4">
          <span>Recent Conversations</span>
          <Button asChild variant="link" size="sm" className="shrink-0 gap-1">
            <Link href={`${BASE_URL}/en/dashboard/conversations`}>
              {t.allConversations}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>

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
