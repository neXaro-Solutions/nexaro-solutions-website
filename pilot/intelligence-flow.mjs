/*
 * PaiLot Intelligence Flow.
 * A purely presentational observer of real application work. No synthetic
 * completion percentages, execution timers or additional API calls.
 */
export function deriveIntelligenceStage({
  job = null, goalId = null, autoSession = null,
  shoppingStage = "", executionActive = false
} = {}) {
  if (shoppingStage === "working") {
    return { phase: "research", label: "Pilot prüft passende Informationen und Angebote" };
  }
  if (job && job.goal_id === goalId && ["queued", "running"].includes(job.status)) {
    const stages = {
      preparing: ["understand", "Pilot bereitet den Auftrag vor"],
      drafting: ["create", "Pilot erarbeitet dein Ergebnis"],
      verifying: ["verify", "Pilot prüft die Ergebnisqualität"],
      saving: ["save", "Pilot speichert dein Ergebnis"]
    };
    const matched = stages[job.stage];
    return matched
      ? {phase: matched[0], label: matched[1]}
      : {phase: "work", label: job.status === "queued"
          ? "Pilot bereitet den nächsten Arbeitsschritt vor"
          : "Pilot arbeitet an deinem Auftrag"};
  }
  if (autoSession?.active) {
    return {phase: "work", label: autoSession.label || "Pilot bearbeitet den nächsten Arbeitsschritt"};
  }
  if (executionActive) {
    return {phase: "work", label: "Pilot führt einen bestätigten Arbeitsschritt aus"};
  }
  return null;
}

export function createIntelligenceFlow(root) {
  if (!root) {
    const noop = () => {};
    return {start: noop, finish: noop, reset: noop, isActive: () => false};
  }
  const particles = [
    [-99,-17,-42,-31],[-93,22,-45,29],[-72,-38,-33,-17],
    [98,-17,45,-32],[91,25,42,30],[74,-38,36,-14]
  ];
  root.innerHTML =
    '<div class="pif-viewport"><div class="pif-panel">' +
      '<div class="pif-art" aria-hidden="true">' +
        '<div class="pif-aura"></div><div class="pif-ring pif-ring-one"></div>' +
        '<div class="pif-ring pif-ring-two"></div>' +
        '<div class="pif-particles"></div>' +
        '<div class="pif-core"><span>✦</span></div>' +
      '</div>' +
      '<div class="pif-copy"><span class="pif-eyebrow">PAILOT · INTELLIGENCE FLOW</span>' +
        '<strong class="pif-message">Pilot arbeitet</strong>' +
        '<span class="pif-caption">Dein Auftrag bleibt jederzeit nachvollziehbar.</span>' +
      '</div>' +
      '<span class="pif-live-dot" aria-hidden="true"></span>' +
    '</div></div>';
  const stream = root.querySelector(".pif-particles");
  stream.innerHTML = particles.map((values, index) => {
    const [fx, fy, mx, my] = values;
    const style = "--fx:" + fx + "px;--fy:" + fy + "px;--mx:" + mx +
      "px;--my:" + my + "px;--delay:-" + (index * 0.43).toFixed(2) + "s";
    return '<i class="pif-particle" style="' + style + '"></i>';
  }).join("");
  const label = root.querySelector(".pif-message");
  let phase = "idle";
  let closing = false;
  let closeTimer = null;
  let concealTimer = null;
  const clearTimers = () => {
    if (closeTimer !== null) clearTimeout(closeTimer);
    if (concealTimer !== null) clearTimeout(concealTimer);
    closeTimer = concealTimer = null;
  };
  const setMessage = message => {
    const next = String(message || "Pilot arbeitet").slice(0,160);
    if (label.textContent !== next) label.textContent = next;
  };
  function start(nextPhase = "work", message = "Pilot arbeitet") {
    clearTimers();
    closing = false;
    const next = String(nextPhase);
    root.dataset.phase = next;
    root.dataset.open = "true";
    root.setAttribute("aria-hidden", "false");
    setMessage(message);
    phase = next;
  }
  function finish(message = "Arbeitsabschnitt abgeschlossen", kind = "done") {
    if (phase === "idle" || closing) return;
    clearTimers();
    closing = true;
    phase = kind;
    root.dataset.phase = kind;
    setMessage(message);
    closeTimer = setTimeout(() => {
      root.dataset.open = "false";
      concealTimer = setTimeout(() => {
        if (root.dataset.open === "false") root.setAttribute("aria-hidden", "true");
        phase = "idle";
        closing = false;
      }, 620);
    }, kind === "waiting" ? 850 : kind === "error" ? 1700 : 1150);
  }
  function reset() {
    clearTimers();
    phase = "idle";
    closing = false;
    root.dataset.phase = "idle";
    root.dataset.open = "false";
    root.setAttribute("aria-hidden", "true");
  }
  reset();
  return {start, finish, reset, isActive: () => phase !== "idle"};
}
