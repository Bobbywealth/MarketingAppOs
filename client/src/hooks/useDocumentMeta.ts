import { useEffect } from "react";

export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description !== undefined) {
      let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description || "");
    }
  }, [title, description]);
}


