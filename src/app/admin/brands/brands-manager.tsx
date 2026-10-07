"use client";

import { Tag } from "lucide-react";
import { BrandForm } from "@/app/admin/brands/brand-form";
import { CrudProvider, useCrudDialogs } from "@/components/crud";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteBrand } from "@/lib/actions/catalog";
import type { Brand } from "@/types/api";

export function BrandsManager({
  initialCreate,
  children,
}: {
  initialCreate: boolean;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const { state, controls, close } = useCrudDialogs<Brand>(initialCreate);
  const editing = state?.mode === "edit" ? state.item : undefined;
  const deleting = state?.mode === "delete" ? state.item : undefined;

  return (
    <CrudProvider controls={controls}>
      {children}

      <Dialog
        open={state?.mode === "create" || state?.mode === "edit"}
        onClose={close}
        title={editing ? `Edit ${editing.displayName}` : "Add new brand"}
        description="Brand details are shown on the public website."
        icon={<Tag />}
        size="lg"
      >
        <BrandForm
          key={editing?._id ?? "new"}
          brand={editing}
          onCancel={close}
          onSuccess={(message) => {
            toast.success(message);
            close();
          }}
        />
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={close}
        title="Delete brand?"
        confirmLabel="Delete brand"
        description={
          <>
            <b className="text-white">{deleting?.displayName}</b> and its logo
            will be permanently deleted. A brand that still has models
            can&apos;t be deleted — remove or reassign those models first.
          </>
        }
        onConfirm={() => deleteBrand(deleting?._id ?? "")}
      />
    </CrudProvider>
  );
}
