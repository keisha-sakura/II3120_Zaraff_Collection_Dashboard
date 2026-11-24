"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type Option = { value: string; label: string; disabled: boolean };
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? textOf(child.props.children)
        : String(child),
    )
    .join("");
}
function readOptions(children: ReactNode, disabled = false): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      }>(child)
    )
      return [];
    if (child.type === "option")
      return [
        {
          value: String(child.props.value ?? textOf(child.props.children)),
          label: textOf(child.props.children),
          disabled: disabled || !!child.props.disabled,
        },
      ];
    return readOptions(
      child.props.children,
      disabled || !!child.props.disabled,
    );
  });
}

/** Custom option menu; the native select preserves FormData and required validation. */
function Dropdown({
  prefix,
  className,
  children,
  value,
  defaultValue,
  onChange,
  id,
  ...props
}: ComponentProps<"select"> & { prefix?: string }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const menuId = `${controlId}-options`;
  const nativeRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const options = readOptions(children);
  const [internal, setInternal] = useState(() =>
    String(
      defaultValue ?? options.find((option) => !option.disabled)?.value ?? "",
    ),
  );
  const selectedValue = value === undefined ? internal : String(value);
  const selected = options.find((option) => option.value === selectedValue);
  const [open, setOpen] = useState(false);
  const typeahead = useRef({ text: "", time: 0 });

  function position() {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const upward = below < 180 && above > below;
    const height = Math.min(
      288,
      Math.max(44, upward ? above : below),
      options.length * 40 + 14,
    );
    const width = Math.min(rect.width, window.innerWidth - 24);
    Object.assign(menu.style, {
      width: `${width}px`,
      maxHeight: `${height}px`,
      left: `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`,
      top: `${upward ? Math.max(12, rect.top - height - 6) : rect.bottom + 6}px`,
    });
  }
  useEffect(() => {
    if (!open) return;
    const reposition = (event: Event) => {
      if (
        event.target instanceof Node &&
        menuRef.current?.contains(event.target)
      )
        return;
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect && (rect.bottom < 0 || rect.top > window.innerHeight))
        menuRef.current?.hidePopover();
      else position();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  });
  function focusOption(index: number) {
    menuRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
      [index]?.focus();
  }
  function show(
    index = options.findIndex(
      (option) => option.value === selectedValue && !option.disabled,
    ),
  ) {
    if (props.disabled || !options.some((option) => !option.disabled)) return;
    position();
    menuRef.current?.showPopover();
    focusOption(
      index >= 0 ? index : options.findIndex((option) => !option.disabled),
    );
  }
  function close(restoreFocus = true) {
    menuRef.current?.hidePopover();
    if (restoreFocus) triggerRef.current?.focus();
  }
  function choose(option: Option) {
    if (option.disabled || !nativeRef.current) return;
    // Dispatch the real select event so existing callers still receive target.value.
    nativeRef.current.value = option.value;
    nativeRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  }
  function onKeyDown(event: KeyboardEvent, index?: number) {
    if (index !== undefined && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(options[index]);
      return;
    }
    const enabled = options
      .map((option, index) => (option.disabled ? -1 : index))
      .filter((index) => index >= 0);
    if (!enabled.length) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") {
      if (open) close();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const current = enabled.indexOf(
        index ?? options.findIndex((option) => option.value === selectedValue),
      );
      const next =
        event.key === "Home"
          ? enabled[0]
          : event.key === "End"
            ? enabled.at(-1)!
            : index === undefined
              ? enabled[Math.max(0, current)]
              : enabled[
                  (current +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    enabled.length) %
                    enabled.length
                ];
      show(next);
      return;
    }
    if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const time = event.timeStamp;
      const text =
        (time - typeahead.current.time < 700 ? typeahead.current.text : "") +
        event.key.toLocaleLowerCase("id-ID");
      typeahead.current = { text, time };
      const match = enabled.find((index) =>
        options[index].label.toLocaleLowerCase("id-ID").startsWith(text),
      );
      if (match !== undefined) show(match);
    }
  }

  return (
    <span
      className={cn(
        "relative min-w-0",
        prefix ? "inline-flex max-w-full" : "block",
      )}
    >
      <select
        {...props}
        id={`${controlId}-native`}
        ref={nativeRef}
        value={value}
        defaultValue={defaultValue}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          setInternal(event.target.value);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          props.onInvalid?.(event);
          triggerRef.current?.focus();
          show();
        }}
      >
        {children}
      </select>
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={props["aria-label"] ?? prefix}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-required={props.required}
        aria-invalid={props["aria-invalid"]}
        disabled={props.disabled}
        className={cn(
          "control flex min-w-0 items-center gap-2 text-left",
          prefix && "w-auto text-sm",
          className,
        )}
        onClick={() =>
          menuRef.current?.matches(":popover-open") ? close() : show()
        }
        onKeyDown={onKeyDown}
      >
        {prefix && <span className="text-muted shrink-0">{prefix}:</span>}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            prefix && "font-semibold",
            !selectedValue && "text-muted",
          )}
        >
          {selected?.label ?? "Pilih…"}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "ml-2 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="listbox"
        aria-label={
          props["aria-label"] ?? prefix ?? selected?.label ?? "Pilihan"
        }
        className="select-menu"
        onToggle={(event) =>
          setOpen(event.currentTarget.matches(":popover-open"))
        }
      >
        {options.map((option, index) => (
          <button
            key={`${option.value}-${index}`}
            type="button"
            role="option"
            aria-selected={selectedValue === option.value}
            disabled={option.disabled}
            tabIndex={-1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => choose(option)}
            className={cn(
              "select-option",
              selectedValue === option.value && "select-option-selected",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {selectedValue === option.value && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </span>
  );
}
export function Select(props: ComponentProps<"select">) {
  return <Dropdown {...props} />;
}
export function FilterSelect({
  label,
  ...props
}: ComponentProps<"select"> & { label: string }) {
  return <Dropdown {...props} prefix={label} />;
}
