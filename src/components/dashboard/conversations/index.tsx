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
  Plus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type {
  Contact as ContactType,
  Message as MessageType,
  PhoneNumber,
  Prisma,
} from "@/lib/prisma/generated";
import { ContactGetPayload, getContactsByUserId } from "@/data/contact";
import { useSession } from "next-auth/react";
import { createMessage, getMessagesByContactId } from "@/data/message";
import { getPhoneNumbersByUser } from "@/data/phoneNumber";
import { Button } from "@/components/ui/button";
import { Input, InputWithIcon } from "@/components/ui/input";
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

const ConversationsComponent = () => {
  const { language } = useI18n();
  const t = translations[language];

  const [contacts, setContacts] = useState<ContactGetPayload[]>();
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
    <main className="flex h-screen overflow-y-auto pb-4">
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
            <Button>
              <Plus className="w-5 h-5" /> New
            </Button>
          </div>

          <div>
            <InputWithIcon
              icon={Search}
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4">
            {(["all", "unread", "archived"] as TabName[]).map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                variant={activeTab === tab ? "default" : "outline"}
              >
                {t[tab]}
              </Button>
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
    </main>
  );
};

export default ConversationsComponent;
