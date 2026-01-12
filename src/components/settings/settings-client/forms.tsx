import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/loaders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function NewAutoReplyRuleDialogue() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">New Rule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Auto Reply Rule</DialogTitle>
          <DialogDescription>
            Set up a new automated response rule
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g., After Hours Response"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-select">Phone Number</Label>
                  <Select>
                    <SelectTrigger id="phone-select">
                      <SelectValue placeholder="Select phone number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">+254712345678</SelectItem>
                      <SelectItem value="2">+254798765432</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger-type">Trigger Type</Label>
                  <Select>
                    <SelectTrigger id="trigger-type">
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEYWORD">Keyword</SelectItem>
                      <SelectItem value="MESSAGE_TYPE">Message Type</SelectItem>
                      <SelectItem value="TIME_BASED">Time Based</SelectItem>
                      <SelectItem value="DEFAULT">Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger-value">Trigger Value</Label>
                  <Input id="trigger-value" placeholder="e.g., help, hi" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply-message">Reply Message</Label>
                <Textarea
                  id="reply-message"
                  placeholder="Enter your automated response message..."
                  rows={4}
                />
              </div>

              {/* <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Rule</Button>
              </div> */}
            </div>
          </CardContent>
        </Card>
        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button type="button" variant="destructive">
              Close
            </Button>
          </DialogClose>
          <Button>Create Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
