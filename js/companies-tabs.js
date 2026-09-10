(function () {
  "use strict";

  /* ============================================================
     Four-tab structure (Studios / Job Postings / Competitions /
     Resources) plus the crowd-added-studios, competitions, and
     resources sections. Loaded after companies.js so it can use
     esc()/animateItemIn()/animateItemOut() equivalents and register
     with window.registerRemoveHandler. Same open-access model as the
     rest of the page: no login, goes live immediately, attribution is
     an optional typed name.
     ============================================================ */

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function removeControlHtml(kind, label) {
    return (
      '<span class="remove-control" data-remove-kind="' + esc(kind) + '" data-remove-label="' + esc(label) + '">' +
        '<button type="button" class="jobs-item-remove remove-trigger" aria-label="Remove ' + esc(label) + '" title="Remove">×</button>' +
      "</span>"
    );
  }

  function animateIn(el) {
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(-4px)";
    requestAnimationFrame(function () {
      el.style.transition = "opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }
  function animateOut(el, cb) {
    if (!el) { if (cb) cb(); return; }
    el.style.transition = "opacity 0.18s ease-out, transform 0.18s ease-out";
    el.style.opacity = "0";
    el.style.transform = "translateY(-4px)";
    setTimeout(function () { el.remove(); if (cb) cb(); }, 190);
  }

  // ---- Tabs ----
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".view-tab"));
  var panels = {
    studios: document.getElementById("panelStudios"),
    jobs: document.getElementById("panelJobs"),
    competitions: document.getElementById("panelCompetitions"),
    resources: document.getElementById("panelResources"),
  };
  var indicator = document.getElementById("viewTabIndicator");

  function positionIndicator(tab) {
    if (!tab || !indicator) return;
    indicator.style.width = tab.offsetWidth + "px";
    indicator.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  var loadedOnce = {};
  function showView(name) {
    tabs.forEach(function (t) {
      var active = t.dataset.view === name;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
      if (active) positionIndicator(t);
    });
    Object.keys(panels).forEach(function (k) { if (panels[k]) panels[k].hidden = k !== name; });
    if (history.replaceState) history.replaceState(null, "", "#" + name);
    if (!loadedOnce[name]) {
      loadedOnce[name] = true;
      if (name === "competitions") {
        var compsListEl = document.getElementById("compsList");
        if (compsListEl) compsListEl.innerHTML = '<li class="jobs-empty muted">Loading…</li>';
        loadCompetitions();
      }
      if (name === "resources") {
        var resourcesListEl = document.getElementById("resourcesList");
        if (resourcesListEl) resourcesListEl.innerHTML = '<li class="jobs-empty muted">Loading…</li>';
        loadResources();
      }
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showView(t.dataset.view); });
  });
  window.addEventListener("resize", function () {
    var active = tabs.filter(function (t) { return t.classList.contains("is-active"); })[0];
    positionIndicator(active);
  });
  window.addEventListener("load", function () {
    var active = tabs.filter(function (t) { return t.classList.contains("is-active"); })[0];
    positionIndicator(active);
  });
  setTimeout(function () {
    var active = tabs.filter(function (t) { return t.classList.contains("is-active"); })[0];
    positionIndicator(active);
  }, 50);

  var initialTab = (location.hash || "").replace("#", "");
  if (panels[initialTab]) showView(initialTab);

  // ---- Studio name autocomplete (Job Postings tab): researched list plus
  // whatever community studios have loaded so far. ----
  var COMMUNITY_STUDIOS = [];
  function refreshStudioDatalist() {
    var datalist = document.getElementById("studioNameList");
    if (!datalist) return;
    var names = (typeof COMPANIES_DATA !== "undefined" ? COMPANIES_DATA.map(function (c) { return c.name; }) : [])
      .concat(COMMUNITY_STUDIOS.map(function (s) { return s.name; }));
    datalist.innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join("");
  }
  refreshStudioDatalist();

  var countStudios = document.getElementById("tabCountStudios");
  function updateStudioCount() {
    if (countStudios) countStudios.textContent = (typeof COMPANIES_DATA !== "undefined" ? COMPANIES_DATA.length : 0) + COMMUNITY_STUDIOS.length;
  }
  updateStudioCount();

  // ---- Crowd-added studios (real backend: /api/studios) ----
  function studioRowHtml(s) {
    return (
      '<tr class="comp-row" data-community-studio-id="' + esc(s.id) + '">' +
        '<td><span class="tier-badge">?</span></td>' +
        '<td class="col-name"><span class="row-chevron">›</span>' + esc(s.name) + '<span class="community-tag">Added by community</span>' +
          removeControlHtml("studio", "this studio") +
          '<span class="col-name-meta">' + esc(s.location || "") + '</span></td>' +
        '<td class="col-loc">' + esc(s.location || "—") + "</td>" +
        '<td class="col-type">' + esc(s.type || "—") + "</td>" +
      "</tr>"
    );
  }
  function loadCommunityStudios() {
    fetch("/api/studios")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        COMMUNITY_STUDIOS = list || [];
        var tbody = document.getElementById("compTableBody");
        if (tbody && COMMUNITY_STUDIOS.length) {
          var frag = document.createElement("tbody");
          frag.innerHTML = COMMUNITY_STUDIOS.map(studioRowHtml).join("");
          Array.prototype.slice.call(frag.children).reverse().forEach(function (tr) {
            tbody.insertBefore(tr, tbody.firstChild);
          });
        }
        refreshStudioDatalist();
        updateStudioCount();
      })
      .catch(function () { /* researched list still shows even if this fails */ });
  }
  loadCommunityStudios();

  var addStudioBtn = document.getElementById("addStudioBtn");
  var addStudioForm = document.getElementById("addStudioForm");
  if (addStudioBtn && addStudioForm) {
    addStudioBtn.addEventListener("click", function () {
      addStudioForm.hidden = !addStudioForm.hidden;
      addStudioBtn.textContent = addStudioForm.hidden ? "+ Add a studio" : "Cancel";
      if (!addStudioForm.hidden) document.getElementById("newStudioName").focus();
    });
    addStudioForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("newStudioName").value.trim();
      var location = document.getElementById("newStudioLocation").value.trim();
      var type = document.getElementById("newStudioType").value.trim();
      var note = document.getElementById("newStudioNote").value.trim();
      var by = document.getElementById("newStudioBy").value.trim();
      if (!name) return;
      var btn = addStudioForm.querySelector(".jobs-add-btn");
      btn.disabled = true;
      fetch("/api/studios", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name, location: location, type: type, note: note, addedBy: by }),
      })
        .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
        .then(function (entry) {
          COMMUNITY_STUDIOS.unshift(entry);
          var tbody = document.getElementById("compTableBody");
          var wrapper = document.createElement("tbody");
          wrapper.innerHTML = studioRowHtml(entry);
          var tr = wrapper.firstChild;
          tbody.insertBefore(tr, tbody.firstChild);
          animateIn(tr);
          refreshStudioDatalist();
          updateStudioCount();
          addStudioForm.reset();
          addStudioForm.hidden = true;
          addStudioBtn.textContent = "+ Add a studio";
          btn.disabled = false;
        })
        .catch(function () { btn.disabled = false; });
    });
  }
  if (window.registerRemoveHandler) {
    window.registerRemoveHandler("studio", function (control) {
      var row = control.closest("tr");
      if (!row) return;
      var id = row.dataset.communityStudioId;
      animateOut(row, function () {
        COMMUNITY_STUDIOS = COMMUNITY_STUDIOS.filter(function (s) { return s.id !== id; });
        updateStudioCount();
        refreshStudioDatalist();
      });
      fetch("/api/studios", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id }),
      }).catch(function () {});
    });
  }

  // ---- Job Postings tab: top-level add form. Resolves the typed company
  // name against the researched list first, then the live community
  // studios list. Requires a match — rather than inventing a synthetic
  // company id — and points people at "+ Add a studio" first if there
  // isn't one yet. ----
  var topLevelJobForm = document.getElementById("topLevelJobForm");
  if (topLevelJobForm) {
    topLevelJobForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var companyName = document.getElementById("topJobCompany").value.trim();
      var role = document.getElementById("topJobRole").value.trim();
      var type = document.getElementById("topJobType") ? document.getElementById("topJobType").value.trim() : "";
      var location = document.getElementById("topJobLocation") ? document.getElementById("topJobLocation").value.trim() : "";
      var employerDate = document.getElementById("topJobEmployerDate") ? document.getElementById("topJobEmployerDate").value.trim() : "";
      var link = document.getElementById("topJobLink").value.trim();
      var by = document.getElementById("topJobBy").value.trim();
      var statusEl = document.getElementById("topJobStatus");
      if (!companyName || !role || !by) return;

      var match = (typeof COMPANIES_DATA !== "undefined" ? COMPANIES_DATA : []).filter(function (c) {
        return c.name.toLowerCase() === companyName.toLowerCase();
      })[0];
      var communityMatch = COMMUNITY_STUDIOS.filter(function (s) {
        return s.name.toLowerCase() === companyName.toLowerCase();
      })[0];
      var companyId = match ? match.id : (communityMatch ? "community:" + communityMatch.id : null);

      if (!companyId) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.textContent = 'Couldn\'t find "' + companyName + '" in the list. Add it as a studio first (above), then post the role.';
        }
        return;
      }
      if (statusEl) statusEl.hidden = true;

      var btn = topLevelJobForm.querySelector(".jobs-add-btn");
      btn.disabled = true;
      fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId: companyId, role: role, type: type, location: location, employerDate: employerDate, link: link, postedBy: by }),
      })
        .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
        .then(function (posting) {
          if (typeof window.addJobPostingLocal === "function") window.addJobPostingLocal(companyId, posting);
          topLevelJobForm.reset();
          btn.disabled = false;
        })
        .catch(function () {
          if (statusEl) { statusEl.hidden = false; statusEl.textContent = "Couldn't add that, try again."; }
          btn.disabled = false;
        });
    });
  }

  // ---- Competitions tab (real backend: /api/competitions) ----
  var COMPETITIONS = [];
  function fmtDeadline(iso) {
    if (!iso) return null;
    var d = new Date(iso + "T23:59:59");
    var diffDays = Math.ceil((d - new Date()) / 86400000);
    return { diffDays: diffDays, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  }
  function renderCompetitions() {
    var el = document.getElementById("compsList");
    if (!el) return;
    if (!COMPETITIONS.length) {
      el.innerHTML = '<li class="jobs-empty muted">Nothing here yet. If a studio you follow has one open, add it below.</li>';
      var countEl0 = document.getElementById("tabCountCompetitions");
      if (countEl0) countEl0.textContent = "0";
      return;
    }
    var sorted = COMPETITIONS.slice().sort(function (a, b) {
      var da = a.deadline ? new Date(a.deadline) : new Date("2999-01-01");
      var db = b.deadline ? new Date(b.deadline) : new Date("2999-01-01");
      return da - db;
    });
    el.innerHTML = sorted.map(function (c) {
      var d = fmtDeadline(c.deadline);
      var open = !d || d.diffDays >= 0;
      var soon = d && open && d.diffDays <= 3;
      var stateClass = d ? (!open ? "is-closed" : soon ? "is-soon" : "is-open") : "";
      var dlText = !d ? "No deadline" : open ? (d.diffDays === 0 ? "Today" : d.diffDays + "d left") : "Closed";
      return (
        '<li class="comp-card" data-comp-id="' + esc(c.id) + '">' +
          '<div class="comp-card-deadline ' + stateClass + '">' +
            '<span class="dl-num">' + esc(dlText) + '</span>' +
            (d ? '<span class="dl-label">' + esc(d.label) + '</span>' : "") +
          "</div>" +
          '<div class="comp-card-main">' +
            '<div class="comp-card-host">' + esc(c.host) + "</div>" +
            '<div class="comp-card-name">' + (c.link
              ? '<a href="' + esc(c.link) + '" target="_blank" rel="noopener noreferrer">' + esc(c.name) + "</a>"
              : esc(c.name)) + "</div>" +
            '<div class="comp-card-meta">added by ' + esc(c.addedBy || "anonymous") + "</div>" +
          "</div>" +
          removeControlHtml("competition", "this competition") +
        "</li>"
      );
    }).join("");
    var countEl = document.getElementById("tabCountCompetitions");
    if (countEl) {
      countEl.textContent = sorted.filter(function (c) {
        var d = fmtDeadline(c.deadline);
        return !d || d.diffDays >= 0;
      }).length;
    }
  }
  function loadCompetitions() {
    fetch("/api/competitions")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { COMPETITIONS = list || []; renderCompetitions(); })
      .catch(function () { renderCompetitions(); });
  }
  // Deferred until the Competitions tab is actually opened (see
  // showView below) — firing this on every page load regardless of
  // which tab is visible meant a real, unnecessary serverless
  // function call (and its cold-start delay) for every single
  // visitor, even ones who never look at this tab.

  var compAddForm = document.getElementById("compAddForm");
  if (compAddForm) {
    compAddForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var host = document.getElementById("compHost").value.trim();
      var name = document.getElementById("compName").value.trim();
      var deadline = document.getElementById("compDeadline").value;
      var link = document.getElementById("compLink").value.trim();
      var by = document.getElementById("compBy").value.trim();
      if (!host || !name) return;
      var btn = compAddForm.querySelector(".jobs-add-btn");
      btn.disabled = true;
      fetch("/api/competitions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ host: host, name: name, deadline: deadline, link: link, addedBy: by }),
      })
        .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
        .then(function (entry) {
          COMPETITIONS.unshift(entry);
          renderCompetitions();
          compAddForm.reset();
          btn.disabled = false;
        })
        .catch(function () { btn.disabled = false; });
    });
  }
  if (window.registerRemoveHandler) {
    window.registerRemoveHandler("competition", function (control) {
      var card = control.closest(".comp-card");
      if (!card) return;
      var id = card.dataset.compId;
      animateOut(card, function () {
        COMPETITIONS = COMPETITIONS.filter(function (c) { return c.id !== id; });
        renderCompetitions();
      });
      fetch("/api/competitions", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id }),
      }).catch(function () {});
    });
  }

  // ---- Resources tab (real backend: /api/resources) ----
  var RESOURCES = [];
  function resourceItemHtml(r) {
    var byline = r.addedBy ? "added by " + esc(r.addedBy) : "added anonymously";
    return (
      '<li class="source-item" data-resource-id="' + esc(r.id) + '">' +
        '<div class="source-item-main">' +
          '<a class="source-item-name" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.name) + "</a>" +
          (r.note ? '<span class="source-item-note">' + esc(r.note) + "</span>" : "") +
          '<span class="source-item-meta">' + byline + "</span>" +
        "</div>" +
        removeControlHtml("resource", "this resource") +
      "</li>"
    );
  }
  function renderResources() {
    var list = document.getElementById("resourcesList");
    if (!list) return;
    list.innerHTML = RESOURCES.length
      ? RESOURCES.map(resourceItemHtml).join("")
      : '<li class="jobs-empty muted">Nothing added yet. Found something useful? Be the first to share it below.</li>';
    var countEl = document.getElementById("tabCountResources");
    if (countEl) countEl.textContent = RESOURCES.length;
  }
  function loadResources() {
    fetch("/api/resources")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { RESOURCES = list || []; renderResources(); })
      .catch(function () { renderResources(); });
  }
  // Deferred until the Resources tab is actually opened (see showView
  // below), same reasoning as Competitions — no reason to cold-start
  // this function for every visitor regardless of which tab they use.

  var resourceAddForm = document.getElementById("resourceAddForm");
  if (resourceAddForm) {
    resourceAddForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = resourceAddForm.querySelector(".source-name").value.trim();
      var url = resourceAddForm.querySelector(".source-url").value.trim();
      var note = resourceAddForm.querySelector(".source-note").value.trim();
      var by = resourceAddForm.querySelector(".source-by").value.trim();
      if (!name || !url) return;
      var btn = resourceAddForm.querySelector(".jobs-add-btn");
      btn.disabled = true;
      fetch("/api/resources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name, url: url, note: note, addedBy: by }),
      })
        .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
        .then(function (entry) {
          RESOURCES.unshift(entry);
          renderResources();
          resourceAddForm.reset();
          btn.disabled = false;
        })
        .catch(function () { btn.disabled = false; });
    });
  }
  if (window.registerRemoveHandler) {
    window.registerRemoveHandler("resource", function (control) {
      var li = control.closest("li");
      if (!li) return;
      var id = li.dataset.resourceId;
      animateOut(li, function () {
        RESOURCES = RESOURCES.filter(function (r) { return r.id !== id; });
        renderResources();
      });
      fetch("/api/resources", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id }),
      }).catch(function () {});
    });
  }

  // ---- Job Postings tab count (Studios/Competitions/Resources counts are
  // set by their own load functions above) ----
  var countJobsEl = document.getElementById("tabCountJobs");
  function updateJobsTabCount() {
    if (!countJobsEl) return;
    var n = document.querySelectorAll("#recentPostingsList .jobs-item:not(.jobs-skeleton)").length;
    countJobsEl.textContent = n;
  }
  var jobsListEl = document.getElementById("recentPostingsList");
  if (jobsListEl && window.MutationObserver) {
    new MutationObserver(updateJobsTabCount).observe(jobsListEl, { childList: true });
  }
  setTimeout(updateJobsTabCount, 600);
})();
