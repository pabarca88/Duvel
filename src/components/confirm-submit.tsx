"use client";

type Props = { action: (formData: FormData) => void | Promise<void>; message: string; className?: string; children: React.ReactNode };

export function ConfirmSubmit({ action, message, className, children }: Props) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm(message)) event.preventDefault(); }}><button className={className ?? "btn btn-danger btn-sm"}>{children}</button></form>;
}
