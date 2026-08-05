"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { UberLog } from "@/domain/entities/uber-log";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UberLogForm } from "@/components/uber-log-form";

export function UberLogFormDialog({ log }: { log: UberLog }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Editar registro"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar registro del {log.logDate}</DialogTitle>
        </DialogHeader>
        <UberLogForm log={log} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
