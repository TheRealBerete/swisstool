import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { logout } from "../actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card className="max-w-md mx-auto p-6 flex flex-col gap-4">
      <h3 className="font-headline-sm text-headline-sm text-on-background">Paramètres</h3>
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
          Connecté en tant que
        </p>
        <p className="font-body-md text-body-md text-on-background">{user?.email}</p>
      </div>
      <form action={logout}>
        <Button type="submit" variant="danger" className="w-full">
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </Button>
      </form>
    </Card>
  );
}
