/**
 * Select menus — on a mouse or trackpad, every `select.bui-select` opens our own menu below
 * the control instead of the system's, which on a Mac covers the control. The real select
 * keeps its value and fires its usual change event, so app code never knows the difference.
 * Touch screens keep the native picker, which suits a thumb better.
 */

const pointerFine = matchMedia("(hover: hover) and (pointer: fine)");

interface Open {
  select: HTMLSelectElement;
  menu: HTMLElement;
  options: HTMLButtonElement[];
}

let open: Open | null = null;

const close = (refocus: boolean) => {
  if (!open) return;
  const { select, menu } = open;
  menu.remove();
  select.removeAttribute("data-menu-open");
  open = null;
  if (refocus) select.focus();
};

const choose = (select: HTMLSelectElement, index: number) => {
  close(true);
  if (select.selectedIndex === index) return;
  select.selectedIndex = index;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
};

const place = (select: HTMLSelectElement, menu: HTMLElement) => {
  const rect = select.getBoundingClientRect();
  const height = menu.offsetHeight;
  const below = innerHeight - rect.bottom - 8;
  const top = below >= height || below >= rect.top ? rect.bottom + 6 : rect.top - 6 - height;
  menu.style.minWidth = `${rect.width}px`;
  menu.style.top = `${Math.max(8, top)}px`;
  menu.style.left = `${Math.min(rect.left, innerWidth - menu.offsetWidth - 8)}px`;
};

const show = (select: HTMLSelectElement) => {
  close(false);
  const menu = document.createElement("div");
  menu.className = "bui-menu";
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", select.getAttribute("aria-label") ?? select.labels?.[0]?.textContent ?? "Options");
  const options = [...select.options].map((option, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "bui-menu__option";
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(index === select.selectedIndex));
    item.textContent = option.textContent;
    item.disabled = option.disabled;
    item.addEventListener("click", () => choose(select, index));
    menu.append(item);
    return item;
  });
  document.body.append(menu);
  place(select, menu);
  select.setAttribute("data-menu-open", "");
  open = { select, menu, options };
  (options[select.selectedIndex] ?? options[0])?.focus();
};

const isMenuSelect = (target: EventTarget | null): target is HTMLSelectElement =>
  target instanceof HTMLSelectElement && target.classList.contains("bui-select") && !target.multiple;

let started = false;

/** Call once per app. Works for selects added later too, since it listens on the document. */
export const initSelectMenus = (): void => {
  if (started) return;
  started = true;

  document.addEventListener("mousedown", (event) => {
    if (open && !open.menu.contains(event.target as Node)) {
      const same = event.target === open.select;
      close(false);
      // A press outside only closes the menu, and a press on its own select closes it too.
      if (same) event.preventDefault();
      return;
    }
    if (!pointerFine.matches || !isMenuSelect(event.target) || event.button !== 0) return;
    event.preventDefault();
    event.target.focus();
    show(event.target);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (open) {
      const { options, select } = open;
      const at = options.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "Escape" || event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        for (let i = 1; i <= options.length; i++) {
          const next = options[(at + step * i + options.length * 2) % options.length];
          if (next && !next.disabled) { next.focus(); break; }
        }
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        options[event.key === "Home" ? 0 : options.length - 1]?.focus();
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        // Type-ahead: jump to the next option starting with that letter.
        const letter = event.key.toLowerCase();
        const next = [...options.slice(at + 1), ...options.slice(0, at + 1)]
          .find((o) => o.textContent?.trim().toLowerCase().startsWith(letter));
        next?.focus();
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (at >= 0) choose(select, at);
      }
      return;
    }
    if (!pointerFine.matches || !isMenuSelect(event.target)) return;
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show(event.target);
    }
  }, true);

  // The menu is placed for the page as it was; anything that moves the page closes it.
  addEventListener("resize", () => close(false));
  document.addEventListener("scroll", (event) => {
    if (open && !open.menu.contains(event.target as Node)) close(false);
  }, true);
};
