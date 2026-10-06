"use client";

import { Bike as BikeIcon } from "lucide-react";
import { BikeForm, type BrandOption } from "@/app/admin/models/bike-form";
import { CrudProvider, useCrudDialogs } from "@/components/crud";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteBike } from "@/lib/actions/catalog";
import type { Bike } from "@/types/api";

export function BikesManager({
  brands,
  initialCreate,
  children,
}: {
  brands: BrandOption[];
  initialCreate: boolean;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const { state, controls, close } = useCrudDialogs<Bike>(initialCreate);
  const editing = state?.mode === "edit" ? state.item : undefined;
  const deleting = state?.mode === "delete" ? state.item : undefined;

  return (
    <CrudProvider controls={controls}>
      {children}

      <Dialog
        open={state?.mode === "create" || state?.mode === "edit"}
        onClose={close}
        title={editing ? `Edit ${editing.name}` : "Add new model"}
        description="Bikes and scooters listed on the website."
        icon={<BikeIcon />}
        size="xl"
      >
        <BikeForm
          key={editing?._id ?? "new"}
          bike={editing}
          brands={brands}
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
        title="Delete model?"
        confirmLabel="Delete model"
        description={
          <>
            <b className="text-white">{deleting?.name}</b> and its image will be permanently deleted
            and removed from the website. Existing orders keep their details.
          </>
        }
        onConfirm={() => deleteBike(deleting?._id ?? "")}
      />
    </CrudProvider>
  );
}
