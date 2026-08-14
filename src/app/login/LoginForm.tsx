"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/shared/Button";
import { Input, Label } from "@/shared/Input";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  // 🧠 useActionState : relie un <form> à une Server Action. React gère le
  // "pending" pendant la requête et récupère l'état retourné par l'action
  // (ici { error }) pour l'afficher, sans écrire de useState + fetch à la main.
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state.error && (
        <p className="font-body-sm text-body-sm text-error">⚠️ {state.error}</p>
      )}
      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
