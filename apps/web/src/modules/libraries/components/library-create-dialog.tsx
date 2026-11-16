import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { LoaderCircleIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { libraryFormSchema } from "../libraries.schemas"

import type { LibraryFormValues } from "../libraries.types"

import { useLibraryCreateMutation } from "@/api/mutations/libraries/useLibraryCreateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type LibraryCreateDialogProps = {
  organizationSlug: string
}

export function LibraryCreateDialog({
  organizationSlug,
}: LibraryCreateDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const schema = libraryFormSchema(t)

  const form = useForm<LibraryFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { name: "" },
  })

  const { mutate: createLibrary, isPending: isCreatePending } =
    useLibraryCreateMutation(organizationSlug, {
      onSuccess: (library) => {
        setIsOpen(false)
        form.reset()
        void navigate({
          to: "/$organizationSlug/libraries/$libraryId",
          params: { organizationSlug, libraryId: library.id },
        })
      },
    })

  const handleOnSubmit = (values: LibraryFormValues) => createLibrary(values)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        {t("libraries.create.trigger")}
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit(handleOnSubmit)(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("libraries.create.title")}</DialogTitle>
            <DialogDescription>
              {t("libraries.create.description")}
            </DialogDescription>
          </DialogHeader>
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <DialogFooter>
            <Button type="submit" disabled={isCreatePending}>
              {isCreatePending && <LoaderCircleIcon className="animate-spin" />}
              {t("libraries.create.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
