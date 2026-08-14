/**
 * 🧠 Event Bus : un canal d'événements central, découplé de tout module
 * précis. Un module ÉMET un événement (`emit`) sans savoir qui écoute ;
 * un autre module s'ABONNE (`on`) sans savoir qui émet. Ça évite que le
 * générateur de mot de passe importe directement le module presse-papier
 * — conforme au PRD §4 "chaque module est indépendant".
 *
 * Table des événements : voir PRD §12.3.
 */

export type AppEvents = {
  "text:shared": { content: string; type: "text" | "password" | "link" };
  "password:generated": { password: string };
};

type Listener<E extends keyof AppEvents> = (payload: AppEvents[E]) => void;
type UnknownListener = (payload: unknown) => void;

class EventBus {
  // Stockage interne volontairement moins précis (`unknown`) : TypeScript
  // ne peut pas prouver la correspondance exacte entre une clé générique
  // `E` et son type de payload à travers une Map. `on`/`emit` restent eux
  // pleinement typés pour qui les appelle — seul l'intérieur de la classe
  // fait ce compromis, une seule fois.
  private listeners = new Map<keyof AppEvents, Set<UnknownListener>>();

  on<E extends keyof AppEvents>(event: E, listener: Listener<E>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const set = this.listeners.get(event)!;
    const unknownListener = listener as UnknownListener;
    set.add(unknownListener);
    // Retourne une fonction de désabonnement, à appeler dans le cleanup
    // d'un useEffect pour éviter les fuites mémoire.
    return () => set.delete(unknownListener);
  }

  emit<E extends keyof AppEvents>(event: E, payload: AppEvents[E]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }
}

export const eventBus = new EventBus();
