"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/shared/Button";
import { Input, Label } from "@/shared/Input";
import { toast } from "@/core/store/useToastStore";
import { changePassword, type ChangePasswordState } from "../actions";

const initialState: ChangePasswordState = { error: null, success: false };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Mot de passe changé");
      formRef.current?.reset();
    }
    // Dépendance sur `state` en entier (pas `state.success`) : useActionState
    // renvoie un NOUVEL objet à chaque soumission, même si `.success` vaut
    // `true` deux fois de suite — dépendre juste du booléen ferait ignorer
    // ce 2e succès par React (même valeur primitive = pas de re-render de
    // l'effet), et le formulaire ne se réinitialiserait qu'une fois sur deux.
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state.error && <p className="font-body-sm text-body-sm text-error">⚠️ {state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        <KeyRound className="w-3.5 h-3.5" />
        {isPending ? "Changement..." : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
