// "use client";

// import React, { useState } from "react";
// import {
//   Search,
//   Send,
//   Paperclip,
//   Smile,
//   MoreVertical,
//   Phone,
//   Video,
//   Archive,
//   Trash2,
//   Check,
//   CheckCheck,
//   Clock,
//   Image,
//   FileText,
//   MapPin,
//   User,
//   X,
//   Filter,
//   ChevronDown,
// } from "lucide-react";
// import Footer from "@/components/ui/footer";
// import { useI18n } from "@/lib/i18n";
// import { Contact } from "@/lib/prisma/generated";

// type TabName = "all" | "unread" | "archived";

// const translations = {
//   en: {
//     title: "Conversations",
//     subtitle: "Manage all your WhatsApp conversations",
//     search: "Search conversations...",
//     typeMessage: "Type a message...",
//     all: "All",
//     unread: "Unread",
//     archived: "Archived",
//     today: "Today",
//     yesterday: "Yesterday",
//     thisWeek: "This Week",
//     older: "Older",
//     online: "Online",
//     typing: "typing...",
//     send: "Send",
//   },
//   sw: {
//     title: "Mazungumzo",
//     subtitle: "Simamia mazungumzo yako yote ya WhatsApp",
//     search: "Tafuta mazungumzo...",
//     typeMessage: "Andika ujumbe...",
//     all: "Yote",
//     unread: "Yasiyosomwa",
//     archived: "Yaliyohifadhiwa",
//     today: "Leo",
//     yesterday: "Jana",
//     thisWeek: "Wiki Hii",
//     older: "Za Zamani",
//     online: "Mkondoni",
//     typing: "anaandika...",
//     send: "Tuma",
//   },
// };

// const ConversationsPage = () => {
//   const { language } = useI18n();
//   const [selectedContact, setSelectedContact] = useState<Contact>();
//   const [messageInput, setMessageInput] = useState("");
//   const [activeTab, setActiveTab] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");

//   const t = translations[language];

//   // Static conversations data
//   const conversations = [
//     {
//       id: 1,
//       name: "John Doe",
//       phone: "+254712345678",
//       avatar: null,
//       lastMessage:
//         "Thanks for the quick response! I really appreciate your help.",
//       timestamp: "2m",
//       unreadCount: 0,
//       status: "read",
//       online: true,
//       category: "today",
//     },
//     {
//       id: 2,
//       name: "Jane Smith",
//       phone: "+254723456789",
//       avatar: null,
//       lastMessage:
//         "When will my order arrive? I've been waiting for 3 days now.",
//       timestamp: "15m",
//       unreadCount: 2,
//       status: "delivered",
//       online: false,
//       category: "today",
//     },
//     {
//       id: 3,
//       name: "Mike Johnson",
//       phone: "+254734567890",
//       avatar: null,
//       lastMessage: "I need help with setting up the integration",
//       timestamp: "1h",
//       unreadCount: 1,
//       status: "sent",
//       online: true,
//       category: "today",
//     },
//     {
//       id: 4,
//       name: "Sarah Wilson",
//       phone: "+254745678901",
//       avatar: null,
//       lastMessage: "Great service! Will definitely recommend to others.",
//       timestamp: "3h",
//       unreadCount: 0,
//       status: "read",
//       online: false,
//       category: "today",
//     },
//     {
//       id: 5,
//       name: "David Brown",
//       phone: "+254756789012",
//       avatar: null,
//       lastMessage: "Can you send me the invoice?",
//       timestamp: "Yesterday",
//       unreadCount: 0,
//       status: "read",
//       online: false,
//       category: "yesterday",
//     },
//     {
//       id: 6,
//       name: "Emma Davis",
//       phone: "+254767890123",
//       avatar: null,
//       lastMessage: "Thank you for the update",
//       timestamp: "2 days ago",
//       unreadCount: 0,
//       status: "read",
//       online: false,
//       category: "thisWeek",
//     },
//   ];

//   // Static messages for selected conversation
//   const messages = selectedContact
//     ? [
//         {
//           id: 1,
//           type: "received",
//           content: "Hi! I need some help with my order",
//           timestamp: "10:30 AM",
//           status: "read",
//         },
//         {
//           id: 2,
//           type: "sent",
//           content: "Hello! I'd be happy to help. What's your order number?",
//           timestamp: "10:32 AM",
//           status: "read",
//         },
//         {
//           id: 3,
//           type: "received",
//           content: "It's #12345",
//           timestamp: "10:33 AM",
//           status: "read",
//         },
//         {
//           id: 4,
//           type: "sent",
//           content: "Thanks! Let me check that for you. One moment please.",
//           timestamp: "10:34 AM",
//           status: "read",
//         },
//         {
//           id: 5,
//           type: "received",
//           content: "Last message",
//           timestamp: selectedContact.lastMessageAt,
//         },
//       ]
//     : [];

//   const filteredConversations = conversations.filter((conv) => {
//     if (activeTab === "unread" && conv.unreadCount === 0) return false;
//     if (
//       searchQuery &&
//       !conv.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
//       !conv.phone.includes(searchQuery)
//     )
//       return false;
//     return true;
//   });

//   const handleSendMessage = () => {
//     if (messageInput.trim() && selectedContact) {
//       // Message sending logic will be implemented with DB
//       setMessageInput("");
//     }
//   };

//   const renderStatusIcon = (status: string) => {
//     switch (status) {
//       case "sent":
//         return <Check className="w-4 h-4 text-muted-foreground" />;
//       case "delivered":
//         return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
//       case "read":
//         return <CheckCheck className="w-4 h-4 text-primary" />;
//       default:
//         return <Clock className="w-4 h-4 text-muted-foreground" />;
//     }
//   };

//   return (
//     <div className="flex h-screen overflow-y-auto pb-4">
//       {/* Conversations List Sidebar */}
//       <div className="w-96 border-r border-border bg-card flex flex-col">
//         {/* Header */}
//         <div className="p-4 border-b border-border">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h1 className="text-2xl font-bold text-card-foreground">
//                 {t.title}
//               </h1>
//               <p className="text-sm text-muted-foreground">{t.subtitle}</p>
//             </div>
//             <button className="p-2 hover:bg-accent rounded-lg transition-colors">
//               <Filter className="w-5 h-5 text-card-foreground" />
//             </button>
//           </div>

//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <input
//               type="text"
//               placeholder={t.search}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//             />
//           </div>

//           {/* Tabs */}
//           <div className="flex gap-2 mt-4">
//             {(["all", "unread", "archived"] as TabName[]).map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                   activeTab === tab
//                     ? "bg-primary text-primary-foreground"
//                     : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
//                 }`}
//               >
//                 {t[tab]}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Conversations List */}
//         <div className="flex-1 overflow-y-auto">
//           {filteredConversations.map((conv) => (
//             <div
//               key={conv.id}
//               onClick={() => setSelectedContact(conv)}
//               className={`p-4 border-b border-border cursor-pointer transition-colors ${
//                 selectedContact?.id === conv.id
//                   ? "bg-accent/20"
//                   : "hover:bg-accent/50"
//               }`}
//             >
//               <div className="flex gap-3">
//                 <div className="relative">
//                   <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
//                     {conv.name.charAt(0)}
//                   </div>
//                   {conv.online && (
//                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
//                   )}
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between mb-1">
//                     <h3 className="font-semibold truncate">{conv.name}</h3>
//                     <span className="text-xs opacity-80">{conv.timestamp}</span>
//                   </div>

//                   <p className="text-sm truncate mb-1">{conv.lastMessage}</p>

//                   <div className="flex items-center justify-between">
//                     <span className="text-xs opacity-80">{conv.phone}</span>
//                     {conv.unreadCount > 0 && (
//                       <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
//                         {conv.unreadCount}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col bg-background">
//         {selectedContact ? (
//           <>
//             {/* Chat Header */}
//             <div className="p-4 border-b border-border bg-card flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="relative">
//                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
//                     {selectedContact.name.charAt(0)}
//                   </div>
//                   {selectedContact.online && (
//                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
//                   )}
//                 </div>
//                 <div>
//                   <h2 className="font-semibold text-card-foreground">
//                     {selectedContact.name}
//                   </h2>
//                   <p className="text-sm text-muted-foreground">
//                     {selectedContact.online ? t.online : selectedContact.phone}
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 <button className="p-2 hover:bg-accent rounded-lg transition-colors">
//                   <Phone className="w-5 h-5 text-card-foreground" />
//                 </button>
//                 <button className="p-2 hover:bg-accent rounded-lg transition-colors">
//                   <Video className="w-5 h-5 text-card-foreground" />
//                 </button>
//                 <button className="p-2 hover:bg-accent rounded-lg transition-colors">
//                   <MoreVertical className="w-5 h-5 text-card-foreground" />
//                 </button>
//               </div>
//             </div>

//             {/* Messages Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {messages.map((msg) => (
//                 <div
//                   key={msg.id}
//                   className={`flex ${
//                     msg.type === "sent" ? "justify-end" : "justify-start"
//                   }`}
//                 >
//                   <div
//                     className={`max-w-md px-4 py-2 rounded-2xl ${
//                       msg.type === "sent"
//                         ? "bg-primary text-primary-foreground rounded-br-none"
//                         : "bg-muted text-card-foreground rounded-bl-none"
//                     }`}
//                   >
//                     <p className="text-sm">{msg.content}</p>
//                     <div className="flex items-center justify-end gap-1 mt-1">
//                       <span className="text-xs opacity-70">
//                         {msg.timestamp}
//                       </span>
//                       {msg.type === "sent" && renderStatusIcon(msg.status)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Message Input */}
//             <div className="p-4 border-t border-border bg-card">
//               <div className="flex items-center gap-2">
//                 <button className="p-2 hover:bg-accent rounded-lg transition-colors">
//                   <Smile className="w-5 h-5 text-muted-foreground" />
//                 </button>
//                 <button className="p-2 hover:bg-accent rounded-lg transition-colors">
//                   <Paperclip className="w-5 h-5 text-muted-foreground" />
//                 </button>

//                 <input
//                   type="text"
//                   placeholder={t.typeMessage}
//                   value={messageInput}
//                   onChange={(e) => setMessageInput(e.target.value)}
//                   onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
//                   className="flex-1 px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//                 />

//                 <button
//                   onClick={handleSendMessage}
//                   disabled={!messageInput.trim()}
//                   className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   <Send className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center text-center">
//             <div>
//               <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
//                 <User className="w-12 h-12 text-muted-foreground" />
//               </div>
//               <h3 className="text-xl font-semibold text-card-foreground mb-2">
//                 Select a conversation
//               </h3>
//               <p className="text-muted-foreground">
//                 Choose a contact to start messaging
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ConversationsPage;

"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Filter,
  Check,
  CheckCheck,
  Clock,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type {
  Contact as ContactType,
  Message as MessageType,
  PhoneNumber,
  Prisma,
} from "@/lib/prisma/generated";
import { getContactsByUserId } from "@/data/contact";
import { useSession } from "next-auth/react";
import { createMessage, getMessagesByContactId } from "@/data/message";
import { getPhoneNumbersByUser } from "@/data/phoneNumber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

type TabName = "all" | "unread" | "archived";

const translations = {
  en: {
    title: "Conversations",
    subtitle: "Manage all your WhatsApp conversations",
    search: "Search conversations...",
    typeMessage: "Type a message...",
    all: "All",
    unread: "Unread",
    archived: "Archived",
    online: "Online",
    send: "Send",
  },
  sw: {
    title: "Mazungumzo",
    subtitle: "Simamia mazungumzo yako yote ya WhatsApp",
    search: "Tafuta mazungumzo...",
    typeMessage: "Andika ujumbe...",
    all: "Yote",
    unread: "Yasiyosomwa",
    archived: "Yaliyohifadhiwa",
    online: "Mkondoni",
    send: "Tuma",
  },
};

const ConversationsPage = () => {
  const { language } = useI18n();
  const t = translations[language];

  const [contacts, setContacts] = useState<
    Prisma.ContactGetPayload<{
      include: {
        messages: true;
        user: true;
      };
    }>[]
  >();
  const [userPhoneNumbers, setUserPhoneNumbers] = useState<PhoneNumber[]>();
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(
    null
  );
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabName>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const userId = session?.user.id;

  async function fetchContacts(userId_: string) {
    try {
      const result = await getContactsByUserId(userId_);
      setContacts(result);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  }

  async function fetchPhoneNumbers(userId_: string) {
    try {
      const phoneNumbers_ = await getPhoneNumbersByUser(userId_);
      setUserPhoneNumbers(phoneNumbers_);
    } catch (error) {
      console.error("Failed to fetch phone numbers:", error);
    }
  }

  async function fetchMessages(contact: ContactType) {
    try {
      const msgs = await getMessagesByContactId(contact.id);
      setMessages(msgs);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }

  // Load contacts & PhoneNumbers
  useEffect(() => {
    if (!userId) return;

    fetchPhoneNumbers(userId);
    fetchContacts(userId);
  }, [userId]);

  // Load messages
  useEffect(() => {
    if (!selectedContact) return;

    fetchMessages(selectedContact);
  }, [selectedContact]);

  const handleSendMessage = async () => {
    if (!selectedContact || !messageInput.trim() || !userPhoneNumbers?.length)
      return;
    if (userPhoneNumbers?.length < 1) {
      toast.error("You have no phone number");
      return;
    }

    try {
      const newMessage = await createMessage({
        userId: selectedContact.userId,
        contactId: selectedContact.id,
        phoneNumberId: userPhoneNumbers[0].id,
        content: { text: messageInput },
        type: "TEXT",
        direction: "OUTBOUND",
        status: "SENT",
        timestamp: new Date(),
      });

      setMessages([...messages, newMessage]);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const filteredContacts = contacts?.filter((contact) => {
    if (
      activeTab === "unread" &&
      contact.messages.every((m) => m.status === "READ")
    )
      return false;
    if (
      searchQuery &&
      !contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !contact.phoneNumber.includes(searchQuery)
    )
      return false;
    return true;
  });

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <Check className="w-4 h-4 text-muted-foreground" />;
      case "DELIVERED":
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      case "READ":
        return <CheckCheck className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-screen overflow-y-auto pb-4">
      {/* Conversations List Sidebar */}
      <div className="w-96 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">
                {t.title}
              </h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Filter className="w-5 h-5 text-card-foreground" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-2 mt-4">
            {(["all", "unread", "archived"] as TabName[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts?.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 border-b border-border cursor-pointer transition-colors ${
                selectedContact?.id === contact.id
                  ? "bg-accent/20"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {contact.name?.charAt(0)}
                  </div>
                  {/* Online indicator can be added if tracked */}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{contact.name}</h3>
                    <span className="text-xs opacity-80">
                      {contact.messages[
                        contact.messages.length - 1
                      ]?.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm truncate mb-1">
                    {JSON.stringify(
                      contact.messages[contact.messages.length - 1]?.content
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {selectedContact.name?.charAt(0)}
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold text-card-foreground">
                    {selectedContact.name}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      msg.direction === "OUTBOUND"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-card-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{JSON.stringify(msg.content)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                      {msg.direction === "OUTBOUND" &&
                        renderStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-card flex items-center gap-2">
              <Button variant="outline">
                <Smile className="w-5 h-5" />
              </Button>
              <Button variant="outline">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                placeholder={t.typeMessage}
                value={messageInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMessageInput(e.target.value)
                }
                onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                className="flex-1 px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                Select a conversation
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
