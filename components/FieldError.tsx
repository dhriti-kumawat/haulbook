import { Icon } from "./Icon";

/** Red message under a form field. `id` is the input's id; the message gets `${id}-error`. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" id={`${id}-error`}>
      <Icon name="alert" size={13} /> {message}
    </span>
  );
}
