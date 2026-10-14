/* Каталог курсов: выбор маршрута подсвечивает курсы на карте и в списке (связанные представления). */
(() => {
const ROUTES = {
  all: null,
  cs229: ["math", "ml-basics", "ml-classic", "deep-learning", "unsupervised", "llm", "rl"],
  tabular: ["math", "ml-basics", "ml-tabular", "ml-project"],
  nn: ["math", "ml-basics", "deep-learning", "llm", "ml-project"],
};

document.addEventListener("DOMContentLoaded", () => {
  const map = document.querySelector("[data-map]");
  if (!map) return;
  const apply = (name) => {
    const route = ROUTES[name];
    const on = (id) => !route || route.includes(id);
    map.classList.toggle("has-route", Boolean(route));
    map.querySelectorAll("[data-node]").forEach((n) => n.classList.toggle("on-route", Boolean(route) && on(n.dataset.node)));
    map.querySelectorAll("[data-edge]").forEach((e) => {
      // ребро на маршруте, если оба его конца на маршруте; data-edge = «откуда куда»
      const [a, b] = e.dataset.edge.split(" ");
      e.classList.toggle("on-route", Boolean(route) && on(a) && on(b));
    });
    document.querySelectorAll("[data-course-row]").forEach((r) => r.classList.toggle("is-off-route", !on(r.dataset.courseRow)));
  };
  document.querySelectorAll('[data-routes] input[name="route"]').forEach((r) => r.addEventListener("change", () => apply(r.value)));
  const demo = new URLSearchParams(location.search).get("route");
  if (demo && ROUTES[demo] !== undefined) {
    const input = document.querySelector(`[data-routes] input[value="${demo}"]`);
    if (input) input.checked = true;
    apply(demo);
  }
});
})();
