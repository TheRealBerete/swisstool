"use client";

import { useEffect } from "react";
import { uploadFile } from "@/core/services/filesApi";

/**
 * Écoute l'événement `paste` (Ctrl+V) sur toute l'appli. Si le
 * presse-papier du SYSTÈME (pas celui de SwissTool — celui du navigateur)
 * contient une image, on l'envoie directement au module Fichiers.
 *
 * On ne touche à rien si le collage ne contient PAS d'image : un Ctrl+V de
 * texte dans le formulaire de partage continue de fonctionner normalement,
 * ce composant ne fait qu'observer.
 */
export function PasteUploadListener() {
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      // Le navigateur nomme souvent ces fichiers "image.png" sans
      // distinction — on renomme pour que la liste dans Fichiers reste
      // lisible si plusieurs images sont collées dans la session.
      const extension = file.type.split("/")[1] ?? "png";
      const named = new File([file], `presse-papier-${Date.now()}.${extension}`, {
        type: file.type,
      });

      // Empêche le navigateur d'insérer l'image en data-URL dans un champ
      // texte éventuellement focus (comportement par défaut sur certains
      // éléments contentEditable) — on gère nous-mêmes le collage d'image.
      event.preventDefault();
      uploadFile(named);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return null;
}
