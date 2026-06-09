import { MessageCircle } from "lucide-react";

import { StatCard } from "@/components/dashboard/shared/stat-card";
import { ConversationService } from "@/services/conversation";

export async function ConversationsCard() {
  const convoService = await ConversationService.create();
  const convos = await convoService.getConversations();

  return (
    <StatCard
      title="Conversations"
      value={convos.length}
      icon={MessageCircle}
    />
  );
}
