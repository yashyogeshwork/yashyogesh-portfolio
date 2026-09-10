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
      var diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "just now";
      if (diffMin < 60) return diffMin + (diffMin === 1 ? " minute ago" : " minutes ago");
      var diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return diffHrs + (diffHrs === 1 ? " hour ago" : " hours ago");
      var diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return "yesterday";
      if (diffDays < 7) return diffDays + " days ago";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  /* ---- Apple-design motion: critically damped only, no overshoot/bounce
     (matches this site's own locked motion rule). A list item that appears
     fades + rises in; one that's removed shrinks its own box to zero before
     leaving the DOM, so the layout around it settles instead of jumping. */
  var EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  function animateItemIn(el) {
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(-6px)";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.transition = "opacity 0.32s " + EASE + ", transform 0.32s " + EASE;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
    setTimeout(function () { el.style.transition = ""; el.style.transform = ""; }, 380);
  }
  function animateItemOut(el, done) {
    if (!el || !el.parentNode) { if (done) done(); return; }
    var rect = el.getBoundingClientRect();
    el.style.height = rect.height + "px";
    el.style.overflow = "hidden";
    void el.offsetHeight; // force reflow so the transition below actually animates
    el.style.transition = [
      "height 0.28s " + EASE, "opacity 0.22s " + EASE, "transform 0.28s " + EASE,
      "margin 0.28s " + EASE, "padding 0.28s " + EASE, "border-color 0.28s " + EASE,
    ].join(", ");
    el.style.opacity = "0";
    el.style.transform = "translateX(-8px)";
    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      if (el.parentNode) el.parentNode.removeChild(el);
      if (done) done();
    }
    el.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 400); // safety net if transitionend doesn't fire
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.height = "0px";
        el.style.marginTop = "0px"; el.style.marginBottom = "0px";
        el.style.paddingTop = "0px"; el.style.paddingBottom = "0px";
        el.style.borderTopWidth = "0px"; el.style.borderBottomWidth = "0px";
      });
    });
  }

  function removeControlHtml(kind, label) {
    return (
      '<span class="remove-control" data-remove-kind="' + esc(kind) + '" data-remove-label="' + esc(label) + '">' +
        '<button type="button" class="jobs-item-remove remove-trigger" aria-label="Remove ' + esc(label) + '" title="Remove">×</button>' +
      "</span>"
    );
  }

  function fmtEmployerDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function jobTagsHtml(p) {
    var tags = "";
    if (p.type) tags += '<span class="job-type-tag">' + esc(p.type) + "</span>";
    if (p.location) tags += '<span class="job-location-tag">' + esc(p.location) + "</span>";
    if (p.employerDate) tags += '<span class="job-date-tag" title="Posted by the employer">Posted ' + esc(fmtEmployerDate(p.employerDate)) + "</span>";
    return tags;
  }

  function jobItemHtml(p, companyId) {
    return (
      '<li class="jobs-item" data-job-id="' + esc(p.id) + '" data-company-id="' + esc(companyId) + '" data-job-type="' + esc(p.type || "") + '">' +
        '<div class="jobs-item-main">' +
          (p.link
            ? '<a class="jobs-item-role" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' + esc(p.role) + "</a>"
            : '<span class="jobs-item-role">' + esc(p.role) + "</span>") +
          jobTagsHtml(p) +
          '<span class="jobs-item-meta">posted by ' + esc(p.postedBy) + " · " + esc(fmtPostedAt(p.postedAt)) + "</span>" +
        "</div>" +
        removeControlHtml("job", "this posting") +
      "</li>"
    );
  }

  function jobsSectionHtml(companyId) {
    var postings = JOBS[companyId] || [];
    var listHtml = postings.length
      ? '<ul class="jobs-list">' + postings.map(function (p) { return jobItemHtml(p, companyId); }).join("") + "</ul>"
      : '<p class="jobs-empty muted">No postings yet for this one. Be the first if you see something open.</p>';

    return (
      '<div class="jobs-section" data-company-id="' + esc(companyId) + '">' +
        '<div class="jobs-section-head">Jobs posted by batchmates</div>' +
        listHtml +
        '<form class="jobs-add-form" data-company-id="' + esc(companyId) + '">' +
          '<input type="text" class="jobs-input jobs-role" placeholder="Role, e.g. Junior Exterior Designer" maxlength="200" required>' +
          '<select class="jobs-input jobs-type"><option value="">Type (optional)</option><option value="Internship">Internship</option><option value="Full-time">Full-time</option></select>' +
          '<input type="text" class="jobs-input jobs-location" placeholder="Location (optional)" maxlength="120">' +
          '<input type="date" class="jobs-input jobs-employer-date" title="Date the employer posted it (optional)">' +
          '<input type="url" class="jobs-input jobs-link" placeholder="Link (optional)" maxlength="500">' +
          '<input type="text" class="jobs-input jobs-name" placeholder="Your name" maxlength="80" required>' +
          '<button type="submit" class="jobs-add-btn">Add</button>' +
          '<span class="jobs-add-status muted" hidden></span>' +
        "</form>" +
      "</div>"
    );
  }

  function companyName(id) {
    for (var i = 0; i < data.length; i++) if (data[i].id === id) return data[i].name;
    return id;
  }

  function allPostingsFlat() {
    var all = [];
    Object.keys(JOBS).forEach(function (cid) {
      (JOBS[cid] || []).forEach(function (p) { all.push({ companyId: cid, posting: p }); });
    });
    all.sort(function (a, b) { return new Date(b.posting.postedAt) - new Date(a.posting.postedAt); });
    return all;
  }

  function feedItemHtml(entry) {
    var p = entry.posting, cid = entry.companyId;
    return (
      '<li class="jobs-item feed-item" data-job-id="' + esc(p.id) + '" data-company-id="' + esc(cid) + '" data-job-type="' + esc(p.type || "") + '">' +
        '<div class="jobs-item-main">' +
          (p.link
            ? '<a class="jobs-item-role" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' + esc(p.role) + "</a>"
            : '<span class="jobs-item-role">' + esc(p.role) + "</span>") +
          jobTagsHtml(p) +
          '<button type="button" class="feed-item-company" data-goto="' + esc(cid) + '">at ' + esc(companyName(cid)) + "</button>" +
          '<span class="jobs-item-meta">posted by ' + esc(p.postedBy) + " · " + esc(fmtPostedAt(p.postedAt)) + "</span>" +
        "</div>" +
        removeControlHtml("job", "this posting") +
      "</li>"
    );
  }

  var jobTypeFilter = "";

  function renderJobFilterBar() {
    var bar = document.getElementById("jobsFilterBar");
    if (!bar) return;
    var all = allPostingsFlat();
    var counts = { Internship: 0, "Full-time": 0, Other: 0 };
    all.forEach(function (entry) {
      var t = entry.posting.type;
      if (t === "Internship" || t === "Full-time") counts[t]++;
      else counts.Other++;
    });
    var pills = [
      { key: "", label: "All", count: all.length },
      { key: "Internship", label: "Internship", count: counts.Internship },
      { key: "Full-time", label: "Full-time", count: counts["Full-time"] },
    ];
    if (counts.Other) pills.push({ key: "Other", label: "Other", count: counts.Other });
    bar.innerHTML = pills.map(function (p) {
      var active = jobTypeFilter === p.key;
      return (
        '<button type="button" class="job-filter-pill' + (active ? " is-active" : "") + '" data-job-filter="' + esc(p.key) + '">' +
          esc(p.label) + ' <span class="job-filter-pill-count">' + p.count + "</span>" +
        "</button>"
      );
    }).join("");
  }
  window.refreshJobFilterBar = renderJobFilterBar;

  document.addEventListener("click", function (e) {
    var pill = e.target.closest ? e.target.closest(".job-filter-pill") : null;
    if (!pill) return;
    jobTypeFilter = pill.dataset.jobFilter || "";
    renderJobFilterBar();
    renderRecentPostings();
  });

  function renderRecentPostings() {
    var list = document.getElementById("recentPostingsList");
    var updatedEl = document.getElementById("recentPostingsUpdated");
    if (!list) return;
    renderJobFilterBar();
    var all = allPostingsFlat();
    var filtered = !jobTypeFilter
      ? all
      : all.filter(function (entry) {
          var t = entry.posting.type;
          if (jobTypeFilter === "Other") return t !== "Internship" && t !== "Full-time";
          return t === jobTypeFilter;
        });
    if (!filtered.length) {
      list.innerHTML = all.length
        ? '<li class="jobs-empty muted">No ' + esc(jobTypeFilter.toLowerCase()) + ' postings right now.</li>'
        : '<li class="jobs-empty muted">Nothing posted yet. Be the first, add one below.</li>';
      if (updatedEl) updatedEl.textContent = "";
      return;
    }
    list.innerHTML = filtered.slice(0, 12).map(feedItemHtml).join("");
    if (updatedEl) updatedEl.textContent = "Last updated " + fmtPostedAt(all[0].posting.postedAt);
  }

  function loadJobs(cb) {
    fetch("/api/jobs")
      .then(function (r) { return r.ok ? r.json() : { companies: {} }; })
      .then(function (d) { JOBS = (d && d.companies) || {}; jobsLoaded = true; renderRecentPostings(); if (cb) cb(); })
      .catch(function () { jobsLoaded = true; renderRecentPostings(); if (cb) cb(); });
  }

  function removeJobEverywhere(companyId, jobId) {
    if (JOBS[companyId]) JOBS[companyId] = JOBS[companyId].filter(function (p) { return p.id !== jobId; });
    fetch("/api/jobs", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyId: companyId, id: jobId }),
    }).catch(function () { /* best-effort: a page refresh will show the true state if this failed */ });
  }

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains("jobs-add-form")) return;
    e.preventDefault();
    var companyId = form.dataset.companyId;
    var role = form.querySelector(".jobs-role").value.trim();
    var typeEl = form.querySelector(".jobs-type");
    var type = typeEl ? typeEl.value.trim() : "";
    var locationEl = form.querySelector(".jobs-location");
    var location = locationEl ? locationEl.value.trim() : "";
    var employerDateEl = form.querySelector(".jobs-employer-date");
    var employerDate = employerDateEl ? employerDateEl.value.trim() : "";
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
      body: JSON.stringify({ companyId: companyId, role: role, type: type, location: location, employerDate: employerDate, link: link, postedBy: postedBy }),
    })
      .then(function (r) { if (!r.ok) throw new Error("failed"); return r.json(); })
      .then(function (posting) {
        if (!JOBS[companyId]) JOBS[companyId] = [];
        JOBS[companyId].unshift(posting);
        var list = form.parentNode.querySelector(".jobs-list");
        var empty = form.parentNode.querySelector(".jobs-empty");
        if (!list) {
          list = document.createElement("ul");
          list.className = "jobs-list";
          form.parentNode.insertBefore(list, empty || form);
        }
        if (empty) empty.remove();
        var wrapper = document.createElement("div");
        wrapper.innerHTML = jobItemHtml(posting, companyId);
        var li = wrapper.firstChild;
        list.insertBefore(li, list.firstChild);
        animateItemIn(li);
        form.reset();
        statusEl.hidden = true;
        btn.disabled = false;
        renderRecentPostings();
      })
      .catch(function () {
        statusEl.textContent = "Couldn't add that, try again.";
        btn.disabled = false;
      });
  });

  /* ---- Remove-with-confirmation: shared by job postings and sources (and,
     visually, by anything else that grows a .remove-control later). Anyone
     can remove anything with no login, so a single misclick shouldn't be
     able to delete something someone else added — the × arms a small
     inline "Remove? Yes / No" prompt instead of acting immediately. It
     reverts on its own after a few seconds, or on a click anywhere else. */
  function armRemoveConfirm(control) {
    if (!control || control.classList.contains("is-confirming")) return;
    document.querySelectorAll(".remove-control.is-confirming").forEach(function (c) {
      if (c !== control) revertRemoveControl(c);
    });
    control.dataset.originalHtml = control.innerHTML;
    control.classList.add("is-confirming");
    var label = control.dataset.removeLabel || "this";
    control.innerHTML =
      '<span class="remove-confirm">Remove ' + esc(label) + "?" +
        '<button type="button" class="remove-confirm-yes">Yes</button>' +
        '<button type="button" class="remove-confirm-no">No</button>' +
      "</span>";
    clearTimeout(control._revertTimer);
    control._revertTimer = setTimeout(function () { revertRemoveControl(control); }, 6000);
  }
  function revertRemoveControl(control) {
    if (!control) return;
    clearTimeout(control._revertTimer);
    control.classList.remove("is-confirming");
    if (control.dataset.originalHtml) control.innerHTML = control.dataset.originalHtml;
  }

  function performJobRemoval(item) {
    var companyId = item.dataset.companyId, jobId = item.dataset.jobId;
    if (!companyId || !jobId) return;
    var duplicates = Array.prototype.slice.call(document.querySelectorAll('.jobs-item[data-job-id="' + jobId + '"]'));
    var pending = duplicates.length;
    var afterAllGone = function () {
      var section = document.querySelector('.jobs-section[data-company-id="' + companyId + '"]');
      if (section && !section.querySelector(".jobs-list li")) {
        var list = section.querySelector(".jobs-list");
        if (list) {
          var empty = document.createElement("p");
          empty.className = "jobs-empty muted";
          empty.textContent = "No postings yet for this one. Be the first if you see something open.";
          list.parentNode.insertBefore(empty, list);
          list.remove();
        }
      }
      renderRecentPostings();
    };
    duplicates.forEach(function (dup) {
      animateItemOut(dup, function () { pending--; if (pending <= 0) afterAllGone(); });
    });
    removeJobEverywhere(companyId, jobId);
  }

  function performSourceRemoval(sourceEl) {
    var id = sourceEl.dataset.sourceId;
    if (!id) return;
    animateItemOut(sourceEl, function () {
      LIVE_SOURCES = LIVE_SOURCES.filter(function (s) { return s.id !== id; });
    });
    fetch("/api/resources", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: id }),
    }).catch(function () { /* best-effort: a refresh will show the true state if this failed */ });
  }

  /* Pluggable by kind, so other sections (Competitions, crowd-added
     Studios, a future Resources tab) can register their own removal
     without this file needing to know about them. */
  var removeHandlers = {
    job: function (control) {
      var item = control.closest(".jobs-item");
      if (item) performJobRemoval(item);
    },
    source: function (control) {
      var el = control.closest(".source-item");
      if (el) performSourceRemoval(el);
    },
  };
  window.registerRemoveHandler = function (kind, fn) { removeHandlers[kind] = fn; };

  /* Lets other scripts (companies-tabs.js's top-level "Add a posting" form)
     register a posting that just went live, without needing to reach into
     this closure's private JOBS/renderRecentPostings. */
  window.addJobPostingLocal = function (companyId, posting) {
    if (!JOBS[companyId]) JOBS[companyId] = [];
    JOBS[companyId].unshift(posting);
    renderRecentPostings();
  };

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest ? e.target.closest(".remove-trigger") : null;
    if (trigger) {
      armRemoveConfirm(trigger.closest(".remove-control"));
      return;
    }

    var yesBtn = e.target.closest ? e.target.closest(".remove-confirm-yes") : null;
    if (yesBtn) {
      var control = yesBtn.closest(".remove-control");
      if (!control) return;
      var handler = removeHandlers[control.dataset.removeKind];
      if (handler) handler(control);
      return;
    }

    var noBtn = e.target.closest ? e.target.closest(".remove-confirm-no") : null;
    if (noBtn) {
      revertRemoveControl(noBtn.closest(".remove-control"));
      return;
    }

    var gotoBtn = e.target.closest ? e.target.closest(".feed-item-company") : null;
    if (gotoBtn) {
      var cid = gotoBtn.dataset.goto;
      var row = document.querySelector('.comp-row[data-id="' + cid + '"]');
      if (!row) { clearAllFilters(); row = document.querySelector('.comp-row[data-id="' + cid + '"]'); }
      if (!row) return;
      if (!row.classList.contains("is-open")) row.click();
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // click anywhere else closes any open "Remove?" prompt
    document.querySelectorAll(".remove-control.is-confirming").forEach(function (c) {
      if (!c.contains(e.target)) revertRemoveControl(c);
    });
  });

  /* ---- "Where else to look": a flat, site-wide list of job boards, design
     forums, an Instagram account, whatever anyone finds, not tied to any one
     company. SOURCES_SEED (below) is the starting set pulled from the
     research corpus; LIVE_SOURCES is whatever's been added since, fetched
     from /api/resources (netlify/functions/sources.js). Same open-access
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
    // Only entries that came through the live form carry an id — the
    // researched seed list (Car Design News, FromFolio, etc.) doesn't, so
    // it never grows a remove control.
    return (
      '<li class="source-item"' + (s.id ? ' data-source-id="' + esc(s.id) + '"' : "") + ">" +
        '<div class="source-item-main">' +
          '<a class="source-item-name" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + "</a>" +
          (s.note ? '<span class="source-item-note">' + esc(s.note) + "</span>" : "") +
          (s.addedAt ? '<span class="source-item-meta">' + byline + when + "</span>" : "") +
        "</div>" +
        (s.id ? removeControlHtml("source", "this resource") : "") +
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
    fetch("/api/resources")
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

      fetch("/api/resources", {
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
  function clearAllFilters() {
    FACETS.forEach(function (f) { selected[f.key].clear(); renderFacetPanel(f); });
    selectedTier.clear(); renderTierToggles();
    search.value = "";
    syncFacetUI(); apply();
  }
  clearBtn.addEventListener("click", function () {
    clearAllFilters();
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
