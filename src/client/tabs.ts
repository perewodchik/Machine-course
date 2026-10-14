// Вкладки (WAI-ARIA Tabs): щелчок или стрелки ←/→, Home, End; активируется вкладка в фокусе; перемещается tabindex.
// Скрытые панели помечены data-inactive (CSS прячет их только при включённом JS).
function select(tab: HTMLElement, focus: boolean): void {
  const list = tab.closest('[role="tablist"]');
  if (!list) return;
  list.querySelectorAll<HTMLElement>('[role="tab"]').forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls") ?? "")?.toggleAttribute("data-inactive", !on);
  });
  if (focus) tab.focus();
}

document.addEventListener("click", (e) => {
  const tab = e.target instanceof Element ? e.target.closest<HTMLElement>('[role="tab"]') : null;
  if (tab) select(tab, false);
});

document.addEventListener("keydown", (e) => {
  const tab = e.target instanceof Element ? e.target.closest<HTMLElement>('[role="tab"]') : null;
  if (!tab) return;
  const tabs = [...(tab.closest('[role="tablist"]')?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
  const i = tabs.indexOf(tab);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  select(tabs[(to + tabs.length) % tabs.length]!, true);
});
