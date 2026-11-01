"use client";

import { CornerDownLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Composer({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim() || disabled) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-input bg-secondary/40 p-3 transition-colors duration-150 focus-within:border-secondary-foreground/40"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="ask" className="sr-only">
        Ask Operator
      </label>
      <textarea
        id="ask"
        rows={2}
        value={text}
        maxLength={300}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask about your leads, deals or revenue"
        className="resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={disabled || !text.trim()}>
          Send <CornerDownLeft />
        </Button>
      </div>
    </form>
  );
}
