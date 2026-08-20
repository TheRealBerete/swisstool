import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { logout } from "../actions";
import { ChangePasswordForm } from "./ChangePasswordForm";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-4">
        <h3 className="font-headline-sm text-headline-sm text-on-background">Compte</h3>
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Connecté en tant que
          </p>
          <p className="font-body-md text-body-md text-on-background break-all">{user?.email}</p>
        </div>
        {/* Utile surtout depuis le passage multi-tenant (plusieurs comptes
            isolés peuvent exister) : savoir depuis quand et depuis quand
            CE compte-ci est actif, sans avoir à ouvrir le dashboard
            Supabase. */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Compte créé le
            </p>
            <p className="font-body-sm text-body-sm text-on-background">
              {formatDate(user?.created_at)}
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Dernière connexion
            </p>
            <p className="font-body-sm text-body-sm text-on-background">
              {formatDate(user?.last_sign_in_at)}
            </p>
          </div>
        </div>
        <form action={logout}>
          <Button type="submit" variant="danger" className="w-full">
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </Button>
        </form>
      </Card>

      <Card className="p-6 flex flex-col gap-4">
        <h3 className="font-headline-sm text-headline-sm text-on-background">Sécurité</h3>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
