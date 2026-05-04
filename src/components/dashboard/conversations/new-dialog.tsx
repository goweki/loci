import NewMessageForm from "@/components/forms/new-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function NewMessageButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-1/2">
        <DialogHeader className="hidden">
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <NewMessageForm />
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
