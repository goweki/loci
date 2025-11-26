"use client";

import { useState } from "react";
import {
  Plus,
  Phone,
  User,
  Search,
  Check,
  X,
  Download,
  PhoneCall,
  Copy,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Settings,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { PhoneNumberStatus, Prisma } from "@/lib/prisma/generated";
import { Button } from "@/components/ui/button";
import AddWhatsappNumberModal from "./new-phone-number-modal";
import WhatsAppEmbeddedSignup from "./waba-embedded-signup";

export default function ContactsComponent({
  phoneNumbers,
  contacts,
}: {
  phoneNumbers: Prisma.PhoneNumberGetPayload<{ include: { messages: true } }>[];
  contacts: Prisma.ContactGetPayload<{ include: { messages: true } }>[];
}) {
  const [activeTab, setActiveTab] = useState<"phone-numbers" | "contacts">(
    "phone-numbers"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
  const [copiedId, setCopiedId] = useState("");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    displayName: "",
    wabaId: "",
    phoneNumberId: "",
  });

  const stats = [
    {
      label: "Total Phone Numbers",
      value: phoneNumbers.length,
      icon: Phone,
      color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600",
    },
    {
      label: "Verified Numbers",
      value: phoneNumbers.filter((p) => p.status === PhoneNumberStatus.VERIFIED)
        .length,
      icon: CheckCircle,
      color: "bg-green-50 dark:bg-green-950/30 text-green-600",
    },
    {
      label: "Total Messages",
      value: phoneNumbers
        .reduce((sum, p) => sum + p.messages.length, 0)
        .toLocaleString(),
      icon: MessageSquare,
      color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      verified:
        "bg-green-50 dark:bg-green-950/30 text-green-600 border-green-200",
      pending:
        "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 border-yellow-200",
      failed: "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleCopyId = (id: string | undefined, type: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleViewDetails = (phone: any) => {
    setSelectedPhone(phone);
    setShowDetailsModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddNumber = () => {
    console.log("Adding number:", formData);
    setShowAddModal(false);
    setFormData({
      phoneNumber: "",
      displayName: "",
      wabaId: "",
      phoneNumberId: "",
    });
  };

  const closeAddModal = () => setShowAddModal(false);

  const filteredPhoneNumbers = phoneNumbers.filter((pn) => {
    const matchesSearch =
      pn.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pn.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || pn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContacts = contacts.filter(
    (c) =>
      c.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Contacts Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your phone numbers and contacts
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border border-border rounded-xl">
          <div className="border-b border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab("phone-numbers")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                  activeTab === "phone-numbers"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="w-4 h-4" />
                My Phone Numbers
                {activeTab === "phone-numbers" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("contacts")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                  activeTab === "contacts"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                Contacts
                {activeTab === "contacts" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "phone-numbers" ? (
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="flex justify-start gap-2">
                  {/* <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-5 h-5" />
                    Add WhatsApp Number
                  </Button> */}
                  <WhatsAppEmbeddedSignup />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold text-card-foreground mt-2">
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters and Search */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search phone numbers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex gap-2">
                      {["all", "verified", "pending"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setStatusFilter(filter)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === filter
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phone Numbers List */}
                {filteredPhoneNumbers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPhoneNumbers.map((phone) => (
                      <div
                        key={phone.id}
                        className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Left Section - Main Info */}
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Phone className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg text-card-foreground">
                                    {phone.displayName}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="font-mono text-sm text-muted-foreground">
                                      {phone.phoneNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {getStatusBadge(phone.status)}
                            </div>

                            {/* IDs Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {phone.wabaId && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    WABA ID
                                  </p>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs text-card-foreground truncate">
                                      {phone.wabaId}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleCopyId(
                                          phone.wabaId ?? undefined,
                                          "waba"
                                        )
                                      }
                                      className="p-1.5 hover:bg-accent rounded transition-colors flex-shrink-0"
                                    >
                                      {copiedId === `waba-${phone.wabaId}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {phone.phoneNumberId && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Phone Number ID
                                  </p>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs text-card-foreground truncate">
                                      {phone.phoneNumberId}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleCopyId(
                                          phone.phoneNumberId ?? undefined,
                                          "phone"
                                        )
                                      }
                                      className="p-1.5 hover:bg-accent rounded transition-colors flex-shrink-0"
                                    >
                                      {copiedId ===
                                      `phone-${phone.phoneNumberId}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Section - Stats */}
                          <div className="lg:w-80 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-600">
                                    Messages Sent
                                  </span>
                                </div>
                                <p className="text-xl font-bold text-blue-600">
                                  {phone.updatedAt.toLocaleString()}
                                </p>
                              </div>

                              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageSquare className="w-4 h-4 text-green-600" />
                                  <span className="text-xs font-medium text-green-600">
                                    Messages Received
                                  </span>
                                </div>
                                <p className="text-xl font-bold text-green-600">
                                  {phone.messages.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Last Active:
                              </span>
                              <span className="font-medium text-card-foreground">
                                {phone.updatedAt.toLocaleDateString()}
                              </span>
                            </div>

                            {phone.verifiedAt && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Verified At:
                                </span>
                                <span className="font-medium text-card-foreground">
                                  {phone.verifiedAt.toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t border-border">
                              <button
                                onClick={() => handleViewDetails(phone)}
                                className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                              >
                                View Details
                              </button>
                              {phone.status ===
                                PhoneNumberStatus.NOT_VERIFIED && (
                                <button className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                                <Settings className="w-4 h-4" />
                              </button>
                              <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Phone className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      No phone numbers found
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Get started by adding your first phone number
                    </p>
                    {/* <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="w-5 h-5" />
                      Add WhatsApp Number
                    </Button> */}
                    {/* <WhatsAppEmbeddedSignup /> */}
                  </div>
                )}
              </div>
            ) : (
              /* Contacts Tab */
              <div className="space-y-6">
                {/* Search and Add */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </button>
                </div>

                {/* Contacts List */}
                <div className="space-y-3">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No contacts found</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            {contact.avatar ? (
                              <img
                                src={contact.avatar}
                                alt={contact.name || contact.phoneNumber}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-semibold text-secondary-foreground">
                                {contact.name
                                  ? contact.name.charAt(0).toUpperCase()
                                  : contact.phoneNumber.slice(-2)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate mb-1">
                              {contact.name || contact.phoneNumber}
                            </h3>
                            {contact.name && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {contact.phoneNumber}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{contact.messages.length} messages</span>
                              <span>•</span>
                              <span>
                                Last message{" "}
                                {formatDate(
                                  contact.lastMessageAt?.toLocaleDateString() ||
                                    null
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-accent rounded-md transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Whatsapp Number Modal */}
        <AddWhatsappNumberModal show={showAddModal} setShow={setShowAddModal} />

        {/* Details Modal */}
        {showDetailsModal && selectedPhone && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-card-foreground">
                  Phone Number Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {selectedPhone.displayName}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedPhone.phoneNumber}
                    </p>
                  </div>
                  {getStatusBadge(selectedPhone.status)}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Messages Sent
                    </p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {selectedPhone.messagesSent.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Messages Received
                    </p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {selectedPhone.messagesReceived.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Daily Limit
                    </p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {selectedPhone.dailyLimit.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Monthly Usage
                    </p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {selectedPhone.monthlyUsage.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      WABA ID
                    </span>
                    <span className="text-sm font-mono text-card-foreground">
                      {selectedPhone.wabaId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Phone Number ID
                    </span>
                    <span className="text-sm font-mono text-card-foreground">
                      {selectedPhone.phoneNumberId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Created At
                    </span>
                    <span className="text-sm text-card-foreground">
                      {selectedPhone.createdAt}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">
                      Verified At
                    </span>
                    <span className="text-sm text-card-foreground">
                      {selectedPhone.verifiedAt || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Last Active
                    </span>
                    <span className="text-sm text-card-foreground">
                      {selectedPhone.lastActive}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                    Edit Configuration
                  </button>
                  <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    View Messages
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
