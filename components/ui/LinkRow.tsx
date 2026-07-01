"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * A table row where tapping anywhere navigates to `href`, while nested links,
 * buttons and form controls keep their own behaviour. Ctrl/Cmd-click and
 * middle-click open in a new tab, like a normal link.
 */
export function LinkRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const inInteractive = (el: EventTarget | null) =>
    el instanceof HTMLElement && el.closest("a,button,input,select,textarea,label");

  return (
    <tr
      onClick={(e) => {
        if (inInteractive(e.target)) return; // let the inner control handle it
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else router.push(href);
      }}
      onAuxClick={(e) => {
        if (e.button === 1 && !inInteractive(e.target)) window.open(href, "_blank");
      }}
      className={cn("cursor-pointer hover-row", className)}
    >
      {children}
    </tr>
  );
}
