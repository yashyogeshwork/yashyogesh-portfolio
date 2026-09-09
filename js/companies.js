(function () {
  "use strict";

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function dtdd(k, v) {
    if (!v) return "";
    return "<dt>" + k + "</dt><dd>" + esc(v) + "</dd>";
  }
  function momentumClass(m) {
    if (!m) return "momentum-unclear";
    var s = m.toLowerCase();
    if (s.indexOf("new") === 0 || s.indexOf("staffing") !== -1) return "momentum-new";
    if (s.indexOf("growing") === 0) return "momentum-growing";
    if (s.indexOf("contracting") === 0) return "momentum-contracting";
    if (s.indexOf("stable") === 0) return "momentum-stable";
    return "momentum-unclear";
  }

  /* ---- Live job postings, tied to company entries. No accounts, no review
     gate: anyone with the page link can add one under a company, attributed
     by whatever name they type. Backend: netlify/functions/jobs.js, a
     Netlify Blobs store hit at /api/jobs. JOBS is keyed by company id. */
  var JOBS = {};
  var jobsLoaded = false;

  function fmtPostedAt(iso) {
    try {
      var d = new Date(iso);
      var diffMs = Date.now() - d.getTime();
      var diffDays = Math.floor(diffMs / 86400000);
      if (diffDays <= 0) return "today";
      if (diffDays === 1) return "yesterday";
      if (diffDays < 7) return diffDays + " days ago";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function jobsSectionHtml(companyId) {
    var postings = JOBS[companyId] || [];
    var listHtml = postings.length
      ? '<ul class="jobs-list">' +
          postings.map(function (p) {
            return (
              '<li class="jobs-item" data-job-id="' + esc(p.id) + '">' +
                '<div class="jobs-item-main">' +
                  (p.link
                    ? '<a class="jobs-item-role" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' + esc(p.role) + "</a>"
                    : '<span class="jobs-item-role">' + esc(p.role) + "</span>") +
                  '<span class="jobs-item-meta">posted by ' + esc(p.postedBy) + " · " + esc(fmtPostedAt(p.postedAt)) + "</span>" +
                "</div>" +
              "</li>"
            );
          }).join("") +
        "</ul>"
      : '<p class="jobs-empty muted">No postings yet for this one. Be the first if you see something open.</p>';

    return (
      '<div class="jobs-section">' +
        '<div class="jobs-section-head">Jobs posted by batchmates</div>' +
        listHtml +
        '<form class="jobs-add-form" data-company-id="' + esc(companyId) + '">' +
          '<input type="text" class="jobs-input jobs-role" placeholder="Role, e.g. Junior Exterior Designer" maxlength="200" required>' +
          '<input type="url" class="jobs-input jobs-link" placeholder="Link (optional)" maxlength="500">' +
          '<input type="text" class="jobs-input jobs-name" placeholder="Your name" maxlength="80" required>' +
          '<button type="submit" class="jobs-add-btn">Add</button>' +
          '<span class="jobs-add-status muted" hidden></span>' +
        "</form>" +
      "</div>"
    );
  }

  function loadJobs(cb) {
    fetch("/api/jobs")
      .then(function (r) { return r.ok ? r.json() : { companies: {} }; })
      .then(function (d) { JOBS = (d && d.companies) || {}; jobsLoaded = true; if (cb) cb(); })
      .catch(function () { jobsLoaded = true; if (cb) cb(); });
  }

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains("jobs-add-form")) return;
    e.preventDefault();
    var companyId = form.dataset.companyId;
    var role = form.querySelector(".jobs-role").value.trim();
    var link = form.querySelector(".jobs-link").value.trim();
    var postedBy = form.querySelector(".jobs-name").value.trim();
    var statusEl = form.querySelector(".jobs-add-status");
    if (!role || !postedBy) return;

    var btn = form.querySelector(".jobs-add-btn");
    btn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = "Adding…";

    fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyId: companyId, role: role, link: link, postedBy: postedBy }),
    })
      .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
      .then(function (posting) {
        if (!JOBS[companyId]) JOBS[companyId] = [];
        JOBS[companyId].unshift(posting);
        var section = form.closest(".jobs-section");
        if (section) section.outerHTML = jobsSectionHtml(companyId);
      })
      .catch(function () {
        statusEl.textContent = "Couldn't add that, try again.";
        btn.disabled = false;
      });
  });

  /* ---- "Where else to look": a flat, site-wide list of job boards, design
     forums, an Instagram account, whatever anyone finds, not tied to any one
     company. SOURCES_SEED (below) is the starting set pulled from the
     research corpus; LIVE_SOURCES is whatever's been added since, fetched
     from /api/sources (netlify/functions/sources.js). Same open-access
     model as the per-company postings: no login, goes live immediately,
     name is optional. */
  var SOURCES_SEED = [
    { name: "Car Design News", url: "https://www.cardesignnews.com/careers/jobs", note: "The field's trade press and its most-used board. Also covers degree shows and design awards." },
    { name: "FromFolio", url: "https://fromfolio.com/jobs", note: "Recruitment platform scoped to four categories, transportation is one of them, so less noise than general boards." },
    { name: "Form Trends", url: "https://formtrends.com/category/jobs/", note: "Automotive design news site with a running jobs category." },
    { name: "Car Body Design", url: "https://www.carbodydesign.com", note: "Long-running community and portfolio site for car designers, occasional postings and student features." },
    { name: "Coroflot", url: "https://www.coroflot.com/design-jobs", note: "General industrial-design job board, filter to transportation/automotive." },
    { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/", note: "Search \"transportation designer\" / \"exterior designer\" / \"CMF designer\", set alerts." },
    { name: "Xing", url: "https://www.xing.com/jobs", note: "Germany-focused, worth a profile even if LinkedIn is primary." },
  ];
  var LIVE_SOURCES = [];

  function fmtAddedAt(iso) {
    try {
      var d = new Date(iso);
      var diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diffDays <= 0) return "today";
      if (diffDays === 1) return "yesterday";
      if (diffDays < 7) return diffDays + " days ago";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function sourceItemHtml(s) {
    var byline = s.addedBy ? "added by " + esc(s.addedBy) : "added anonymously";
    var when = s.addedAt ? " · " + esc(fmtAddedAt(s.addedAt)) : "";
    return (
      '<li class="source-item">' +
        '<a class="source-item-name" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + "</a>" +
        (s.note ? '<span class="source-item-note">' + esc(s.note) + "</span>" : "") +
        (s.addedAt ? '<span class="source-item-meta">' + byline + when + "</span>" : "") +
      "</li>"
    );
  }

  function renderSources() {
    var list = document.getElementById("sourcesList");
    if (!list) return;
    var all = LIVE_SOURCES.concat(SOURCES_SEED);
    list.innerHTML = all.map(sourceItemHtml).join("");
  }

  function loadSources() {
    fetch("/api/sources")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { LIVE_SOURCES = list || []; renderSources(); })
      .catch(function () { renderSources(); });
  }

  function initSources() {
    renderSources();
    loadSources();
    var form = document.getElementById("sourceAddForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = form.querySelector(".source-name");
      var urlEl = form.querySelector(".source-url");
      var noteEl = form.querySelector(".source-note");
      var byEl = form.querySelector(".source-by");
      var statusEl = form.querySelector(".source-add-status");
      var name = nameEl.value.trim();
      var url = urlEl.value.trim();
      var note = noteEl.value.trim();
      var addedBy = byEl.value.trim();
      if (!name || !url) return;

      var btn = form.querySelector(".source-add-btn");
      btn.disabled = true;
      statusEl.hidden = false;
      statusEl.textContent = "Adding…";

      fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name, url: url, note: note, addedBy: addedBy }),
      })
        .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
        .then(function (entry) {
          LIVE_SOURCES.unshift(entry);
          renderSources();
          form.reset();
          statusEl.hidden = true;
          btn.disabled = false;
        })
        .catch(function () {
          statusEl.textContent = "Couldn't add that, check the link and try again.";
          btn.disabled = false;
        });
    });
  }

  var data = COMPANIES_DATA;
  var europeCount = data.filter(function (c) { return c.list === "master"; }).length;
  var backupCount = data.filter(function (c) { return c.list === "backup"; }).length;
  document.getElementById("footerMeta").textContent =
    data.length + " organisations (" + europeCount + " Europe, " + backupCount + " backup) · compiled Aug 2026";

  function uniq(field) {
    var s = {};
    data.forEach(function (c) { if (c[field]) s[c[field]] = true; });
    return Object.keys(s).sort();
  }
  function countWhere(field, value) {
    var n = 0;
    data.forEach(function (c) { if (c[field] === value) n++; });
    return n;
  }

  /* ---- Type bucketing: 29 raw values -> a small canonical set for filtering.
     The raw string is always kept for on-screen display; bucketing only
     narrows the *filter* option list. ---- */
  var TYPE_BUCKETS = [
    { key: "OEM", test: function (s) { return s.indexOf("oem") !== -1 && s.indexOf("china") === -1; } },
    { key: "OEM-China in EU", test: function (s) { return s.indexOf("oem") !== -1 && s.indexOf("china") !== -1; } },
    { key: "Supplier / engineering (Tier 1)", test: function (s) { return s.indexOf("tier 1") !== -1 || s.indexOf("engineering") !== -1 || s.indexOf("contract manufactur") !== -1; } },
    { key: "Consultancy", test: function (s) { return s.indexOf("consultanc") !== -1 || s.indexOf("coachbuilder") !== -1 || s.indexOf("architecture practice") !== -1; } },
    { key: "Startup", test: function (s) { return s.indexOf("startup") !== -1; } },
    { key: "Recruiter / network", test: function (s) { return s.indexOf("recruiter") !== -1 || s.indexOf("reference network") !== -1; } }
  ];
  function typeBuckets(raw) {
    if (!raw) return [];
    var s = raw.toLowerCase();
    var out = [];
    TYPE_BUCKETS.forEach(function (b) { if (b.test(s)) out.push(b.key); });
    if (!out.length) out.push("Other");
    return out;
  }
  function typeBucketOptions() {
    var s = {};
    data.forEach(function (c) { typeBuckets(c.type).forEach(function (k) { s[k] = true; }); });
    var order = TYPE_BUCKETS.map(function (b) { return b.key; }).concat(["Other"]);
    return order.filter(function (k) { return s[k]; });
  }

  /* ---- Country splitting: combined strings like "Germany / France" match
     BOTH a "Germany" filter and a "France" filter. Raw string still displays
     as-is in the table. ---- */
  var COUNTRY_ALIASES = { "nl": "Netherlands" };
  function countryTokens(raw) {
    if (!raw) return [];
    return raw.split("/").map(function (t) { return t.trim(); }).filter(function (t) {
      return t && t.toLowerCase() !== "europe" && t.toLowerCase() !== "global";
    }).map(function (t) {
      return COUNTRY_ALIASES[t.toLowerCase()] || t;
    });
  }
  function countryOptions() {
    var s = {};
    data.forEach(function (c) { countryTokens(c.country).forEach(function (t) { s[t] = true; }); });
    return Object.keys(s).sort();
  }
  function countWhereTokens(tokenFn, value) {
    var n = 0;
    data.forEach(function (c) { if (tokenFn(c).indexOf(value) !== -1) n++; });
    return n;
  }

  /* ---- Vehicle focus bucketing: same multi-match pattern as Type. A raw
     value like "Cars / trucks" can match more than one bucket. ---- */
  var VEHICLE_BUCKETS = [
    { key: "Cars", test: function (s) { return s.indexOf("car") !== -1 || s.indexOf("automotive") !== -1; } },
    { key: "Motorcycles", test: function (s) { return s.indexOf("motorcycle") !== -1; } },
    { key: "Trucks, vans & buses", test: function (s) { return s.indexOf("truck") !== -1 || s.indexOf("bus") !== -1 || s.indexOf("van") !== -1 || s.indexOf("lcv") !== -1 || s.indexOf("commercial vehicle") !== -1 || s.indexOf("freight") !== -1; } },
    { key: "Rail", test: function (s) { return s.indexOf("rail") !== -1; } },
    { key: "Marine", test: function (s) { return s.indexOf("boat") !== -1 || s.indexOf("ferr") !== -1 || s.indexOf("hydrofoil") !== -1 || s.indexOf("marine") !== -1; } },
    { key: "Off-highway & industrial", test: function (s) { return s.indexOf("agricultur") !== -1 || s.indexOf("off-highway") !== -1 || s.indexOf("construction") !== -1 || s.indexOf("forestry") !== -1 || s.indexOf("port") !== -1 || s.indexOf("terminal") !== -1 || s.indexOf("fire") !== -1 || s.indexOf("rescue") !== -1 || s.indexOf("outdoor power") !== -1 || s.indexOf("robotics") !== -1 || s.indexOf("industrial") !== -1 || s.indexOf("mining") !== -1; } },
    { key: "Bicycles / e-bikes", test: function (s) { return s.indexOf("bike") !== -1 || s.indexOf("bicycle") !== -1 || s.indexOf("scooter") !== -1; } },
    { key: "Aviation & space", test: function (s) { return s.indexOf("aircraft") !== -1 || s.indexOf("aviation") !== -1 || s.indexOf("space") !== -1 || s.indexOf("evtol") !== -1; } },
    { key: "Cross-industry / mobility", test: function (s) { return s.indexOf("cross-industry") !== -1 || s.indexOf("mobility") !== -1 || s.indexOf("strategy") !== -1 || (s.indexOf("product") !== -1 && s.indexOf("automotive") === -1); } }
  ];
  function vehicleBuckets(raw) {
    if (!raw) return [];
    var s = raw.toLowerCase();
    var out = [];
    VEHICLE_BUCKETS.forEach(function (b) { if (b.test(s)) out.push(b.key); });
    if (!out.length) out.push("Other");
    return out;
  }
  function vehicleBucketOptions() {
    var s = {};
    data.forEach(function (c) { vehicleBuckets(c.vehicleFocus).forEach(function (k) { s[k] = true; }); });
    var order = VEHICLE_BUCKETS.map(function (b) { return b.key; }).concat(["Other"]);
    return order.filter(function (k) { return s[k]; });
  }

  /* ---- Internship bucketing: collapse ~40 free-text variants into 3. ---- */
  function internBucket(raw) {
    if (!raw) return "Unclear / none listed";
    var s = raw.toLowerCase();
    if (s.indexOf("unknown") !== -1 || s.indexOf("n/a") !== -1) return "Unclear / none listed";
    if (s.indexOf("rare") !== -1 || s.indexOf("occasion") !== -1) return "Occasional, not routine";
    if (s.indexOf("yes") !== -1 || s.indexOf("via") !== -1 || s.indexOf("historically") !== -1) return "Yes, offered";
    return "Unclear / none listed";
  }
  var INTERN_ORDER = ["Yes, offered", "Occasional, not routine", "Unclear / none listed"];
  function internOptions() {
    var s = {};
    data.forEach(function (c) { s[internBucket(c.interns)] = true; });
    return INTERN_ORDER.filter(function (k) { return s[k]; });
  }

  /* ---- Junior hire odds ("Job" filter): strip parenthetical qualifiers so
     "High (as a channel)" and "High" are the same filter option. ---- */
  function jobBucket(raw) {
    if (!raw) return "n/a";
    var stripped = raw.replace(/\s*\([^)]*\)\s*/g, "").trim();
    return stripped || "n/a";
  }
  var JOB_ORDER = ["High", "Medium-High", "Medium", "Low-Medium", "Low", "n/a"];
  function jobOptions() {
    var s = {};
    data.forEach(function (c) { s[jobBucket(c.juniorOdds)] = true; });
    return JOB_ORDER.filter(function (k) { return s[k]; });
  }

  var FACETS = [
    { key: "market", field: "region", label: "Market", options: uniq("region") },
    {
      key: "country", field: "country", label: "Country", options: countryOptions(),
      match: function (c, v) { return countryTokens(c.country).indexOf(v) !== -1; },
      countFn: function (v) { return countWhereTokens(function (c) { return countryTokens(c.country); }, v); }
    },
    {
      key: "type", field: "type", label: "Type", options: typeBucketOptions(),
      match: function (c, v) { return typeBuckets(c.type).indexOf(v) !== -1; },
      countFn: function (v) { return countWhereTokens(function (c) { return typeBuckets(c.type); }, v); },
      note: "A company can match more than one type, so these counts can add up to more than the total. “Supplier / engineering (Tier 1)” is an automotive-industry term for a supplier one level above the OEM (interiors, seating, lighting, contract engineering). It's unrelated to this table's Tier A/B/C priority rating above."
    },
    {
      key: "vehicle", field: "vehicleFocus", label: "Vehicle focus", options: vehicleBucketOptions(),
      match: function (c, v) { return vehicleBuckets(c.vehicleFocus).indexOf(v) !== -1; },
      countFn: function (v) { return countWhereTokens(function (c) { return vehicleBuckets(c.vehicleFocus); }, v); },
      note: "A company can span more than one vehicle focus, so these counts can add up to more than the total."
    },
    {
      key: "internship", field: "_internBucket", label: "Internship",
      options: internOptions(),
      match: function (c, v) { return internBucket(c.interns) === v; },
      countFn: function (v) { var n = 0; data.forEach(function (c) { if (internBucket(c.interns) === v) n++; }); return n; }
    },
    {
      key: "job", field: "_jobBucket", label: "Job", options: jobOptions(),
      match: function (c, v) { return jobBucket(c.juniorOdds) === v; },
      countFn: function (v) { var n = 0; data.forEach(function (c) { if (jobBucket(c.juniorOdds) === v) n++; }); return n; },
      note: "Junior hire odds: how realistic an entry-level or new-grad hire is at this company."
    }
  ];
  var selected = {};
  FACETS.forEach(function (f) { selected[f.key] = new Set(); });

  var TIER_OPTIONS = ["A", "B", "C"];
  var TIER_LABELS = { A: "Tier A: pursue", B: "Tier B: apply", C: "Tier C: watch" };
  var selectedTier = new Set();
  var tierRow = document.getElementById("tierToggleRow");
  function renderTierToggles() {
    if (!tierRow) return;
    tierRow.innerHTML = TIER_OPTIONS.map(function (t) {
      var n = countWhere("tier", t);
      return (
        '<button type="button" class="tier-toggle tier-toggle-' + t + (selectedTier.has(t) ? " is-active" : "") + '" data-tier="' + t + '">' +
          '<span class="tier-badge tier-' + t + '">' + t + "</span>" +
          '<span class="tier-toggle-label">' + TIER_LABELS[t] + "</span>" +
          '<span class="tier-toggle-count">' + n + "</span>" +
        "</button>"
      );
    }).join("");
    tierRow.querySelectorAll(".tier-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = btn.dataset.tier;
        if (selectedTier.has(t)) selectedTier.delete(t); else selectedTier.add(t);
        renderTierToggles(); syncFacetUI(); apply();
      });
    });
  }

  var facetRow = document.getElementById("facetRow");
  var search = document.getElementById("compSearch");
  var tbody = document.getElementById("compTableBody");
  var count = document.getElementById("compCount");
  var activeChips = document.getElementById("activeChips");
  var clearBtn = document.getElementById("clearFiltersBtn");
  var XSVG = '<svg viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  facetRow.innerHTML = FACETS.map(function (f) {
    return (
      '<div class="facet" data-facet="' + f.key + '">' +
        '<button type="button" class="facet-btn" data-facet-btn="' + f.key + '" aria-expanded="false">' +
          "<span>" + f.label + "</span>" +
          '<span class="facet-btn-count" data-facet-count="' + f.key + '" hidden></span>' +
          '<svg class="facet-btn-caret" width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1L4.5 5L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<div class="facet-panel" data-facet-panel="' + f.key + '"></div>' +
      "</div>"
    );
  }).join("");

  function renderFacetPanel(f) {
    var panel = facetRow.querySelector('[data-facet-panel="' + f.key + '"]');
    if (!f.options.length) { panel.innerHTML = '<div class="facet-panel-empty">No values in this data.</div>'; return; }
    var html = f.note ? '<div class="facet-panel-note">' + esc(f.note) + "</div>" : "";
    html += '<div class="facet-panel-actions">' +
      '<button type="button" data-facet-selectall="' + f.key + '">Select all</button>' +
      '<button type="button" data-facet-clear="' + f.key + '">Clear</button>' +
      "</div>";
    html += f.options.map(function (opt) {
      var id = "facet-" + f.key + "-" + opt.replace(/[^a-z0-9]/gi, "");
      var lbl = f.valueLabel ? f.valueLabel(opt) : opt;
      var n = f.countFn ? f.countFn(opt) : countWhere(f.field, opt);
      return (
        '<label class="facet-option" for="' + id + '">' +
          '<input type="checkbox" id="' + id + '" value="' + esc(opt) + '"' + (selected[f.key].has(opt) ? " checked" : "") + ">" +
          '<span class="facet-option-label">' + esc(lbl) + "</span>" +
          '<span class="facet-option-count">' + n + "</span>" +
        "</label>"
      );
    }).join("");
    panel.innerHTML = html;
    panel.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        if (cb.checked) selected[f.key].add(cb.value); else selected[f.key].delete(cb.value);
        syncFacetUI(); apply();
      });
    });
    panel.querySelector('[data-facet-selectall="' + f.key + '"]').addEventListener("click", function () {
      f.options.forEach(function (opt) { selected[f.key].add(opt); });
      renderFacetPanel(f); syncFacetUI(); apply();
    });
    panel.querySelector('[data-facet-clear="' + f.key + '"]').addEventListener("click", function () {
      selected[f.key].clear();
      renderFacetPanel(f); syncFacetUI(); apply();
    });
  }
  FACETS.forEach(renderFacetPanel);

  /* Closing plays the mirror of the open animation (facet-out) instead of
     snapping to display:none instantly, so open/close read as one
     reversible gesture rather than an open animation with no exit. */
  function closeFacet(el) {
    if (!el.classList.contains("is-open")) return;
    el.classList.remove("is-open");
    el.classList.add("is-closing");
    el.querySelector(".facet-btn").setAttribute("aria-expanded", "false");
    var panel = el.querySelector(".facet-panel");
    var onDone = function (e) {
      if (e.target !== panel) return;
      el.classList.remove("is-closing");
      panel.removeEventListener("animationend", onDone);
    };
    panel.addEventListener("animationend", onDone);
  }
  function closeAllFacets(exceptKey) {
    facetRow.querySelectorAll(".facet").forEach(function (el) {
      if (el.dataset.facet !== exceptKey) closeFacet(el);
    });
  }
  facetRow.querySelectorAll("[data-facet-btn]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var el = btn.closest(".facet");
      var willOpen = !el.classList.contains("is-open");
      closeAllFacets(willOpen ? el.dataset.facet : null);
      if (willOpen) {
        el.classList.remove("is-closing");
        el.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", function (e) { if (!facetRow.contains(e.target)) closeAllFacets(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllFacets(null); });

  function syncFacetUI() {
    var anySelected = false;
    FACETS.forEach(function (f) {
      var n = selected[f.key].size;
      var btn = facetRow.querySelector('[data-facet-btn="' + f.key + '"]');
      var badge = facetRow.querySelector('[data-facet-count="' + f.key + '"]');
      btn.classList.toggle("has-selection", n > 0);
      badge.hidden = n === 0;
      badge.textContent = n;
      if (n > 0) anySelected = true;
    });
    var hasSearch = search.value.trim().length > 0;
    var hasTier = selectedTier.size > 0;
    clearBtn.hidden = !(anySelected || hasSearch || hasTier);

    var chips = [];
    selectedTier.forEach(function (v) {
      chips.push({ facet: "tier", label: "Tier", value: v, text: "Tier " + v });
    });
    FACETS.forEach(function (f) {
      selected[f.key].forEach(function (v) {
        chips.push({ facet: f.key, label: f.label, value: v, text: f.valueLabel ? f.valueLabel(v) : v });
      });
    });
    activeChips.innerHTML = chips.map(function (c) {
      return (
        '<span class="chip" data-chip-facet="' + c.facet + '" data-chip-value="' + esc(c.value) + '">' +
          '<span class="chip-facet-label">' + esc(c.label) + ":</span> " + esc(c.text) +
          '<button type="button" class="chip-remove" aria-label="Remove ' + esc(c.text) + ' filter">' + XSVG + "</button>" +
        "</span>"
      );
    }).join("");
    activeChips.querySelectorAll(".chip-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chip = btn.closest(".chip");
        var fk = chip.dataset.chipFacet, v = chip.dataset.chipValue;
        if (fk === "tier") {
          selectedTier.delete(v);
          renderTierToggles();
        } else {
          selected[fk].delete(v);
          var f = FACETS.filter(function (x) { return x.key === fk; })[0];
          if (f) renderFacetPanel(f);
        }
        syncFacetUI(); apply();
      });
    });
  }
  clearBtn.addEventListener("click", function () {
    FACETS.forEach(function (f) { selected[f.key].clear(); renderFacetPanel(f); });
    selectedTier.clear(); renderTierToggles();
    search.value = "";
    syncFacetUI(); apply();
  });
  renderTierToggles();

  /* ---- Sorting ---- */
  var sortKey = "tier";
  var sortDir = "asc";
  var TIER_ORDER = { A: 0, B: 1, C: 2 };
  function sortValue(c, key) {
    if (key === "tier") return TIER_ORDER[c.tier] !== undefined ? TIER_ORDER[c.tier] : 9;
    if (key === "location") return (c.country || "") + " " + (c.location || "");
    return (c[key] || "").toString().toLowerCase();
  }
  document.querySelectorAll("#compTable thead th[data-sort]").forEach(function (th) {
    th.innerHTML = th.textContent + ' <span class="sort-arrow">↓</span>';
    th.addEventListener("click", function () {
      var key = th.dataset.sort;
      if (sortKey === key) { sortDir = sortDir === "asc" ? "desc" : "asc"; }
      else { sortKey = key; sortDir = "asc"; }
      document.querySelectorAll("#compTable thead th").forEach(function (t) { t.classList.remove("is-sorted", "is-sorted-desc"); });
      th.classList.add("is-sorted");
      if (sortDir === "desc") th.classList.add("is-sorted-desc");
      apply();
    });
  });
  document.querySelector('#compTable thead th[data-sort="tier"]').classList.add("is-sorted");

  var openIds = new Set();

  function rowHtml(c) {
    var open = openIds.has(c.id);
    return (
      '<tr class="comp-row' + (open ? " is-open" : "") + '" data-id="' + c.id + '" tabindex="0" role="button" aria-expanded="' + (open ? "true" : "false") + '" aria-label="' + esc(c.name) + ', tier ' + esc(c.tier) + ', expand for full detail">' +
        '<td><span class="tier-badge tier-' + esc(c.tier) + '">' + esc(c.tier) + "</span></td>" +
        '<td class="col-name"><span class="row-chevron">›</span>' + esc(c.name) +
          '<span class="col-name-meta">' + esc(c.location) + (c.country ? ", " + esc(c.country) : "") + (c.type ? " · " + esc(c.type) : "") + "</span>" +
        "</td>" +
        '<td class="col-loc">' + esc(c.location) + (c.country ? ", " + esc(c.country) : "") + "</td>" +
        '<td class="col-type">' + esc(c.type) + "</td>" +
      "</tr>" +
      '<tr class="detail-row"><td colspan="4"><div class="detail-row-inner"><div class="detail-row-content">' +
        '<dl class="detail-grid">' +
          (c.momentum ? '<dt>Momentum <span class="dt-hint">hiring trend</span></dt><dd><span class="momentum-badge ' + momentumClass(c.momentum) + '">' + esc(c.momentum) + "</span></dd>" : "") +
          (c.confidence ? '<dt>Confidence <span class="dt-hint">how sure this data is</span></dt><dd>' + esc(c.confidence) + "</dd>" : "") +
          dtdd("Owner / group", c.owner) +
          dtdd("Vehicle focus / brands", c.vehicleFocus) +
          dtdd("Sector", c.sector) +
          dtdd("Capital origin", c.capitalOrigin) +
          dtdd("Roles they hire", c.roles) +
          dtdd("Interns?", c.interns) +
          dtdd("Junior hire odds", c.juniorOdds) +
          dtdd("Pay band", c.payBand) +
          dtdd("Contact route", c.contactRoute) +
          dtdd("Best window", c.bestWindow) +
          '<div class="detail-full"><dt>Reputation</dt><dd>' + esc(c.reputation) + "</dd>" +
            '<div class="strategy-block">' + esc(c.strategy) + "</div>" +
          "</div>" +
        "</dl>" +
        jobsSectionHtml(c.id) +
      "</div></div></td></tr>"
    );
  }

  function apply() {
    var q = search.value.trim().toLowerCase();
    var filtered = data.filter(function (c) {
      if (selectedTier.size && !selectedTier.has(c.tier)) return false;
      for (var i = 0; i < FACETS.length; i++) {
        var f = FACETS[i];
        if (!selected[f.key].size) continue;
        if (f.match) {
          var any = false;
          selected[f.key].forEach(function (v) { if (f.match(c, v)) any = true; });
          if (!any) return false;
        } else if (!selected[f.key].has(c[f.field])) return false;
      }
      if (q && c.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    filtered.sort(function (a, b) {
      var va = sortValue(a, sortKey), vb = sortValue(b, sortKey);
      var cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    if (filtered.length) {
      tbody.innerHTML = filtered.map(rowHtml).join("");
      tbody.querySelectorAll(".comp-row").forEach(function (row) {
        function toggleRow() {
          var id = row.dataset.id;
          var open = row.classList.toggle("is-open");
          row.setAttribute("aria-expanded", open ? "true" : "false");
          if (open) openIds.add(id); else openIds.delete(id);
        }
        row.addEventListener("click", toggleRow);
        row.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            toggleRow();
          }
        });
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4"><div class="table-empty">' +
        "<p>No organisations match this combination.</p>" +
        '<p class="muted">Try removing a filter or broadening the search.</p>' +
        '<button type="button" id="emptyStateClear">Clear filters</button>' +
        "</div></td></tr>";
      var esBtn = document.getElementById("emptyStateClear");
      if (esBtn) esBtn.addEventListener("click", function () { clearBtn.click(); });
    }
    count.textContent = filtered.length + " of " + data.length;
    syncFacetUI();
  }
  search.addEventListener("input", apply);
  syncFacetUI();
  apply();
  loadJobs(function () { apply(); });
  initSources();
})();
