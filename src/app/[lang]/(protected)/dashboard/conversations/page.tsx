// import ConversationsComponent from "@/components/dashboard/conversations";

import { getConversationsAction } from "@/actions/conversation.actions";
import { ConversationsComponent } from "@/components/dashboard/conversations";
import { requireUser } from "@/lib/auth";
import { ConversationDTO } from "@/services/conversation";

// export default function ConversationsPage() {
//   return <ConversationsComponent />;
// }

export default async function ConversationsPage() {
  const resConvos = await getConversationsAction();

  let conversations: ConversationDTO[] | null = null;
  let error: string | null = null;

  if (!resConvos.ok) error = resConvos.error;
  else conversations = resConvos.data;

  return (
    <ConversationsComponent
      initialConversations={conversations}
      error={error}
    />
  );
}
