import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const FOOTER_HEIGHT = 24;
const EDGE_SPACING = 24;
const PANEL_GAP = 0; /* space between the field and its dropdown */
const MIN_PANEL_HEIGHT = 120; /* minimum room for the options */
const PANEL_SPACE = 70; /* room the open panel needs below the field */

const textOf = (node) => {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf(node.props.children);
  return "";
};

const collectOptions = (children, out = []) => {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      const label = textOf(child.props.children).trim();
      out.push({
        value:
          child.props.value !== undefined && child.props.value !== null
            ? String(child.props.value)
            : label,
        label,
        disabled: !!child.props.disabled,
      });
    } else if (child.type === Fragment || child.type === "optgroup") {
      collectOptions(child.props.children, out);
    }
  });
  return out;
};

const LAYOUT_CLASS =
  /^(?:[a-z0-9-]+:)*-?(?:w-|min-w-|max-w-|flex-|shrink|grow|basis-|col-span|row-span|col-start|self-|order-|m[trblxy]?-)/;

const SearchSelect = ({
  name,
  id,
  value,
  onChange,
  disabled = false,
  className = "",
  children,
  placeholder,
  options: optionList,
  labelKey = "label",
  valueKey = "id",
  stringValue = true,
  hasError = false,
  disabledHint = "",
  ...rest
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 260,
  });
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);

  const listMode = Array.isArray(optionList);
  const allOptions = listMode
    ? optionList.map((o) => ({
        value: String(o?.[valueKey] ?? ""),
        raw: o?.[valueKey],
        label: String(o?.[labelKey] ?? ""),
        disabled: !!o?.disabled,
      }))
    : collectOptions(children);
  const emptyOption = listMode ? null : allOptions.find((o) => o.value === "");
  const options = listMode
    ? allOptions
    : allOptions.filter((o) => o.value !== "");
  const current = value === null || value === undefined ? "" : String(value);
  const selected = options.find((o) => o.value === current);
  const placeholderText =
    placeholder ||
    emptyOption?.label ||
    (listMode ? t("Select...") : t("Select"));

  const classes =
    `${listMode ? "flex-1 h-[38px] form-input text-sm" : ""} ${className} ${
      hasError ? "border-red-400" : ""
    }`
      .split(/\s+/)
      .filter(Boolean);
  const layoutClasses = classes.filter((c) => LAYOUT_CLASS.test(c));
  const boxClasses = classes.filter((c) => !LAYOUT_CLASS.test(c));
  const hasWidth = layoutClasses.some((c) =>
    /^(?:[a-z0-9-]+:)*(?:w-|flex-1|grow)/.test(c),
  );

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  const emit = (val, opt) => {
    if (!onChange) return;
    if (listMode) {
      onChange(!opt ? "" : stringValue ? opt.value : opt.raw);
      return;
    }
    const target = { name, id, value: val, type: "select-one" };
    onChange({
      target,
      currentTarget: target,
      preventDefault() {},
      stopPropagation() {},
      persist() {},
    });
  };

  /* Always opens below the field with a gap. */
  const updatePosition = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const top = rect.bottom + PANEL_GAP;
    const spaceBelow = window.innerHeight - top - FOOTER_HEIGHT - EDGE_SPACING;
    setPosition({
      left: rect.left,
      width: rect.width,
      top,
      maxHeight: Math.max(spaceBelow, MIN_PANEL_HEIGHT),
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      )
        return;
      const scrollContainer = e.target.closest?.(".admin-main");
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        const scrollbarWidth =
          scrollContainer.offsetWidth - scrollContainer.clientWidth;
        if (scrollbarWidth > 0 && e.clientX >= rect.right - scrollbarWidth)
          return;
      }
      /* clicking outside: close and clear the search so "Select" shows again */
      setSearch("");
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  /* Make room BELOW the field: if the page has no space under it, add
     temporary bottom padding to the scroll area and scroll down. */
  useEffect(() => {
    if (!open) return;

    const container = ref.current?.closest(".admin-main");

    /* selects outside .admin-main (e.g. the popup) keep the old behaviour */
    if (!container) {
      const scrollTimer = setTimeout(() => {
        ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 200);
      return () => clearTimeout(scrollTimer);
    }

    const originalPadding = container.style.paddingBottom;
    const currentPadding =
      parseFloat(getComputedStyle(container).paddingBottom) || 0;

    const inputRect = ref.current.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const visibleBottom = Math.min(
      containerRect.bottom,
      window.innerHeight - FOOTER_HEIGHT,
    );

    const spaceBelow = visibleBottom - inputRect.bottom;
    const needed = PANEL_SPACE + PANEL_GAP + EDGE_SPACING;
    const deficit = needed - spaceBelow;

    if (deficit > 0) {
      container.style.paddingBottom = `${currentPadding + deficit}px`;
      container.scrollBy({ top: deficit, behavior: "smooth" });
    }

    return () => {
      container.style.paddingBottom = originalPadding;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const openPanel = () => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === current);
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const close = (refocus = false) => {
    setSearch("");
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    emit(opt.value, opt);
    close(true);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    emit("");
    close();
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      if (open) close();
      else openPanel();
    } else if (e.key === "Escape" && open) {
      close();
    }
  };

  const handleSearchKeyDown = (e) => {
    /* keep keys typed in the search from reaching the trigger's handler */
    e.stopPropagation();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) handleSelect(filtered[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div
      ref={ref}
      className={`searchable-select relative min-w-0 ${
        hasWidth ? "" : "w-full"
      } ${layoutClasses.join(" ")}`}
    >
      {/* the dropdown is a styled div, which a <label> cannot point at: this
          invisible field gives the label a real target and hands focus on */}
      <input
        type="text"
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        value=""
        className="sr-only"
        onFocus={() => triggerRef.current?.focus()}
      />
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        title={disabled && disabledHint ? disabledHint : undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={handleTriggerKeyDown}
        style={
          open && !disabled
            ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
            : undefined
        }
        className={`${boxClasses.join(" ")} flex items-center justify-between w-full min-w-0 box-border select-none text-left ${
          disabled
            ? "bg-gray-100 cursor-not-allowed opacity-70"
            : "cursor-pointer"
        }`}
        {...rest}
      >
        {open && !disabled ? (
          /* search replaces the "Select" text while the field is open.
             Clicking it bubbles to the trigger's onClick, which closes the panel. */
          <input
            type="text"
            autoFocus
            placeholder={t("Search...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={handleSearchKeyDown}
            className="block min-w-0 flex-1 w-full text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 select-text"
          />
        ) : (
          <span
            title={selected ? selected.label : placeholderText}
            className={`block truncate min-w-0 flex-1 ${
              selected ? (listMode ? "text-gray-800" : "") : "text-gray-400"
            }`}
          >
            {selected ? selected.label : placeholderText}
          </span>
        )}
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {current !== "" && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label={t("Clear")}
            >
              <FiX className="text-xs" />
            </button>
          )}
          <FiChevronDown
            className={`text-gray-400 text-xs transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </div>

      {open &&
        !disabled &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              zIndex: 10005,
            }}
            className="flex flex-col bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg overflow-hidden"
          >
            <div
              ref={listRef}
              role="listbox"
              className="max-h-18 min-h-0 overflow-y-auto"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-400 text-center">
                  {t("No results found")}
                </div>
              ) : (
                filtered.map((opt, idx) => (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={opt.value === current}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`w-full text-left px-3 py-2 text-sm transition ${
                      opt.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "cursor-pointer"
                    } ${
                      opt.value === current
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : idx === highlight
                          ? "bg-gray-50 text-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default SearchSelect;
