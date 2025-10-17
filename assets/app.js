
(() => {
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const resultsHostId = "results";
  let DATA = [];

  function normAppl(s) {
    if (!s) return "";
    const m = String(s).match(/(\d+)/);
    return m ? m[1] : "";
  }
  function normErr(s) {
    if (!s) return "";
    return String(s).trim().replace(/^0x/i, "").toLowerCase();
  }
  function includesFold(hay, needle) {
    if (!needle) return true;
    return String(hay||"").toLowerCase().includes(String(needle).toLowerCase());
  }

  function ensureResultsHost() {
    let host = document.getElementById(resultsHostId);
    if (!host) {
      host = document.createElement("div");
      host.id = resultsHostId;
      host.className = "container mx-auto p-4";
      document.body.appendChild(host);
    }
    return host;
  }

  function makeCard(row) {
    const wrap = document.createElement("div");
    wrap.className = "card bg-base-100 shadow-xl mb-4";
    wrap.innerHTML = `
      <div class="card-body">
        <h2 class="card-title">
          ApplFault: <span class="font-mono">${row.applFault || "-"}</span>
          <span class="mx-2">|</span>
          errorCode: <span class="font-mono">0x${row.errorCode || "-"}</span>
        </h2>
        <p class="opacity-80 mb-2"><strong>Symptom</strong>: ${row.symptom || "-"}</p>
        <div class="grid grid-cols-1 gap-2">
          ${row.msgId ? `<div><strong>Msg ID:</strong> ${row.msgId}</div>` : ""}
          ${row.description ? `<div><strong>Description:</strong> ${row.description}</div>` : ""}
          ${row.replace ? `<div><strong>Replace:</strong> ${row.replace}</div>` : ""}
          ${row.referTo ? `<div><strong>Refer To:</strong> ${row.referTo}</div>` : ""}
          ${row.note ? `<div><strong>Note:</strong> ${row.note}</div>` : ""}
        </div>
      </div>
    `;
    return wrap;
  }

  function renderResults(rows) {
    const host = ensureResultsHost();
    host.innerHTML = "";
    if (!rows || rows.length === 0) {
      // 3) if no result, don't show anything (we simply keep host empty)
      return;
    }
    // 1) multiple results -> multiple cards
    rows.forEach(r => host.appendChild(makeCard(r)));
  }

  // public hook if an existing search UI wants to drive rendering
  window.renderSearchResults = renderResults;

  // Optional: auto-wire to existing inputs if present; else provide minimal search box.
  function autoWire() {
    const applInput = $("#applfaultInput") || $("#applFault") || $("#applfault");
    const errInput  = $("#errorCodeInput") || $("#errorCode") || $("#error");
    const symInput  = $("#symptomInput") || $("#symptom");
    const form      = $("#searchForm");

    function doSearch() {
      const applQ = normAppl(applInput && applInput.value);
      const errQ  = normErr(errInput && errInput.value);
      const symQ  = (symInput && symInput.value) ? symInput.value.trim() : "";

      const matches = DATA.filter(r =>
        (!applQ || r.applFault === applQ) &&
        (!errQ  || r.errorCode === errQ) &&
        includesFold(r.symptom, symQ)
      );
      renderResults(matches);
    }

    if (form && (applInput || errInput || symInput)) {
      form.addEventListener("submit", (e) => { e.preventDefault(); doSearch(); });
      $$$("input,select", form).forEach(el => el.addEventListener("change", doSearch));
      $$$("input", form).forEach(el => el.addEventListener("keyup", (e) => { if (e.key === "Enter") doSearch(); }));
    } else {
      // Build a minimal search UI if none exists
      const container = document.createElement("div");
      container.className = "container mx-auto p-4";
      container.innerHTML = `
        <div class="form-control mb-3">
          <label class="label"><span class="label-text">ApplFault</span></label>
          <input id="__appl" class="input input-bordered" placeholder="e.g. 2852 or (2852)">
        </div>
        <div class="form-control mb-3">
          <label class="label"><span class="label-text">errorCode (hex)</span></label>
          <input id="__err" class="input input-bordered" placeholder="e.g. 835 or 0x835">
        </div>
        <div class="form-control mb-3">
          <label class="label"><span class="label-text">Symptom contains</span></label>
          <input id="__sym" class="input input-bordered" placeholder="keyword">
        </div>
        <button id="__go" class="btn btn-primary w-full">Search</button>
      `;
      document.body.prepend(container);
      const appl = $("#__appl"), err = $("#__err"), sym = $("#__sym"), go = $("#__go");
      const doSearch2 = () => {
        const matches = DATA.filter(r =>
          (!normAppl(appl.value) || r.applFault === normAppl(appl.value)) &&
          (!normErr(err.value) || r.errorCode === normErr(err.value)) &&
          includesFold(r.symptom, sym.value)
        );
        renderResults(matches);
      };
      go.addEventListener("click", doSearch2);
    }
  }

  fetch("./assets/records_full.json")
    .then(r => r.json())
    .then(json => { DATA = json || []; autoWire(); })
    .catch(err => console.error("Failed to load data:", err));
})();
