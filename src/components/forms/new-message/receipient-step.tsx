import React, { useState, useMemo, useCallback } from "react";
import {
  Check,
  ChevronsUpDown,
  UserPlus,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { getContactsAction } from "@/actions/contacts.actions";
import { Contact } from "@/lib/prisma/generated";
import toast from "react-hot-toast";
import { toastWarning } from "@/lib/utils/toastHandlers";
import { NewMessageDTO } from "./dto";

interface RecipientStepProps {
  step: number;
  next: () => void;
  form: NewMessageDTO;
  setForm: React.Dispatch<React.SetStateAction<NewMessageDTO>>;
}

export default function RecipientStep({
  step,
  next,
  form,
  setForm,
}: RecipientStepProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  const fetchContacts = useCallback(async () => {
    const contactsRes = await getContactsAction();

    if (contactsRes.ok) {
      setContacts(contactsRes.data);
    } else {
      toastWarning("Failed to fetch contacts");
    }
  }, []);

  const isNewContact = useMemo(() => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
    const isPhone = /^\+?[\d\s-]{10,}$/.test(inputValue);
    return isEmail || isPhone;
  }, [inputValue]);

  const handleSelect = (contactValue: string) => {
    setForm({ ...form, contact: contactValue });
    setOpen(false);
  };

  if (step !== 1) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Select Recipient
        </h2>
        <p className="text-sm text-muted-foreground">
          Search existing contacts or enter a new destination.
        </p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 text-left font-normal border-slate-200 hover:border-primary/50 transition-colors"
          >
            {form.contact ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  To:
                </Badge>
                {form.contact}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Search name, phone, or email...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Type a name or number..."
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {isNewContact ? (
                  <div
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-sm m-1"
                    onClick={() => handleSelect(inputValue)}
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Add &quot;{inputValue}&quot;
                      </span>
                      <span className="text-xs text-muted-foreground">
                        New recipient
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-center text-muted-foreground">
                    No results found.
                  </p>
                )}
              </CommandEmpty>

              <CommandGroup heading="Recent Contacts">
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.name ?? undefined}
                    onSelect={() => handleSelect(contact.phoneNumber)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.phoneNumber}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        form.contact === contact.phoneNumber
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-muted-foreground italic">
          Tip: You can paste multiple numbers separated by commas.
        </div>
        <Button
          onClick={next}
          disabled={!form.contact}
          className="px-8 shadow-lg shadow-primary/20"
        >
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
