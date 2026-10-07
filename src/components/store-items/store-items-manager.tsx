"use client";

import { Package, Wrench } from "lucide-react";
import { CrudProvider, useCrudDialogs } from "@/components/crud";
import {
  StoreItemForm,
  storeItemTitle,
} from "@/components/store-items/store-item-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteStoreItem } from "@/lib/actions/catalog";
import { STORE_KINDS, type StoreKind } from "@/lib/store-kinds";
import type { StoreItem } from "@/types/api";

export function StoreItemsManager({
  kind,
  initialCreate,
  children,
}: {
  kind: StoreKind;
  initialCreate: boolean;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const { state, controls, close } = useCrudDialogs<StoreItem>(initialCreate);
  const editing = state?.mode === "edit" ? state.item : undefined;
  const deleting = state?.mode === "delete" ? state.item : undefined;
  const { singular, title } = STORE_KINDS[kind];
  const Icon = kind === "accessories" ? Package : Wrench;

  return (
    <CrudProvider controls={controls}>
      {children}

      <Dialog
        open={state?.mode === "create" || state?.mode === "edit"}
        onClose={close}
        title={storeItemTitle(kind, editing)}
        description={`${title} listed in the website's shop.`}
        icon={<Icon />}
        size="lg"
      >
        <StoreItemForm
          key={editing?._id ?? "new"}
          kind={kind}
          item={editing}
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
        title={`Delete ${singular}?`}
        confirmLabel={`Delete ${singular}`}
        description={
          <>
            <b className="text-white">{deleting?.name}</b> and its image will be
            permanently deleted and removed from the website.
          </>
        }
        onConfirm={() => deleteStoreItem(kind, deleting?._id ?? "")}
      />
    </CrudProvider>
  );
}
