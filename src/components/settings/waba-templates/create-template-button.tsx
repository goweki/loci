// // app/dashboard/templates/create-template-button.tsx

// "use client";

// import { Button } from "@/components/ui/button";

// export function CreateTemplateButton() {
//   const handleCreate = () => {
//     // TODO: Implement create template modal or navigate to create page
//     console.log("Create template clicked");
//   };

//   return (
//     <Button onClick={handleCreate}>
//       <svg
//         className="w-5 h-5"
//         fill="none"
//         stroke="currentColor"
//         viewBox="0 0 24 24"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M12 4v16m8-8H4"
//         />
//       </svg>
//       Create Template
//     </Button>
//   );
// }

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
import TemplateForm from "./form";

export function CreateTemplateButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Create Template
        </Button>
      </DialogTrigger>
      {/* <DialogContent className="sm:max-w-[425px] max-h-4/5 overflow-y-auto"> */}
      <DialogContent className="sm:max-w-[425px] max-h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>
        <TemplateForm />
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
