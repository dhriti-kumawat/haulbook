"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function PasswordInput(props: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={props.id}
        className="input"
        type={visible ? "text" : "password"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        aria-describedby={props.describedBy}
        required
      />
      <button
        type="button"
        className="icon-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={16} />
      </button>
    </div>
  );
}
