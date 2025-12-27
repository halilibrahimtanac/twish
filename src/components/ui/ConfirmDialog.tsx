import React from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  onConfirm: () => void;
  contentProps?: React.ComponentProps<typeof DialogContent>;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  onConfirm,
  contentProps,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent {...contentProps}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
