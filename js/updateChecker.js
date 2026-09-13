/**
 * In-app release update checker (GitHub Releases).
 *
 * Ported from Hand-Math js/updateChecker.js for Aloha APK sideload parity:
 * compares the packaged app version (js/appVersion.js) against the latest
 * GitHub release tag. When a newer release exists, shows release notes and
 * offers the APK download (opened in the system browser, where Android
 * handles the download/install prompt — critical for restricted kids
 * tablets that cannot install PWAs).
 *
 * Design notes (kept from Hand-Math):
 * - Network failures are silent for auto-checks (console.warn only).
 * - A skipped release is remembered; manual checks override the skip.
 * - "Up to date" only shows for manual checks.
 * - GitHub API 403/429 falls back to tag-only latest.json (raw.githubusercontent).
 */
(function () {
  'use strict';

  var REPO = 'bizzkoot/aloha';
  var LS_SKIP = 'aloha-update-skip';
  var LS_LAST_ATTEMPT = 'aloha-update-last-attempt';
  var LS_LAST_SUCCESS = 'aloha-update-last-check';

  function currentVersion() {
    return typeof window.ALOHA_VERSION === 'string' ? window.ALOHA_VERSION : '0.0.0';
  }

  function compareVersions(a, b) {
    function parse(v) {
      return String(v).trim().replace(/^v/i, '').split(/[.\-+]/).map(function (part) {
        return /^\d+$/.test(part) ? parseInt(part, 10) : part;
      });
    }
    var pa = parse(a);
    var pb = parse(b);
    var len = Math.max(pa.length, pb.length);
    for (var i = 0; i < len; i++) {
      var x = pa[i] !== undefined ? pa[i] : 0;
      var y = pb[i] !== undefined ? pb[i] : 0;
      if (typeof x === 'number' && typeof y === 'number') {
        if (x !== y) return x - y;
      } else {
        var xs = String(x);
        var ys = String(y);
        if (xs !== ys) return xs < ys ? -1 : 1;
      }
    }
    return 0;
  }

  function isRateLimit(err) {
    var msg = String((err && err.message) || err || '');
    return /\b(403|429)\b/.test(msg);
  }

  function fetchWithTimeout(url, opts, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 10000);
    opts = opts || {};
    opts.signal = ctrl.signal;
    return fetch(url, opts).finally(function () { clearTimeout(timer); });
  }

  function fetchLatestFromApi() {
    return fetchWithTimeout('https://api.github.com/repos/' + REPO + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    }).then(function (resp) {
      if (!resp.ok) throw new Error('GitHub API ' + resp.status);
      return resp.json();
    }).then(function (data) {
      if (!data || !data.tag_name || data.draft === true) return null;
      var assets = data.assets || [];
      var apk = null;
      for (var i = 0; i < assets.length; i++) {
        var a = assets[i];
        if (a && typeof a.browser_download_url === 'string' && /\.apk$/i.test(a.name || '')) {
          apk = a.browser_download_url;
          break;
        }
      }
      return {
        tag: data.tag_name,
        name: data.name || '',
        notes: data.body || '',
        htmlUrl: data.html_url || ('https://github.com/' + REPO + '/releases/latest'),
        apkUrl: apk,
      };
    });
  }

  function fetchLatestTag() {
    return fetchWithTimeout('https://raw.githubusercontent.com/' + REPO + '/main/latest.json', {
      cache: 'no-store',
    }).then(function (resp) {
      if (!resp.ok) throw new Error('latest.json ' + resp.status);
      return resp.json();
    }).then(function (data) {
      if (!data || typeof data.tag !== 'string' || !/^v?[\d]/.test(data.tag)) return null;
      return {
        tag: data.tag,
        name: '',
        notes: '',
        htmlUrl: 'https://github.com/' + REPO + '/releases/latest',
        apkUrl: null,
      };
    });
  }

  function AlohaUpdateChecker() {
    this.autoAttemptIntervalMs = 30 * 60 * 1000;
    this.autoSuccessIntervalMs = 3 * 60 * 60 * 1000;
    this.initialDelayMs = 3000;
    this._timer = 0;
    this._modal = null;
    this._checking = false;
  }

  AlohaUpdateChecker.compareVersions = compareVersions;

  AlohaUpdateChecker.prototype.start = function () {
    if (this._timer) return;
    var self = this;
    setTimeout(function () { self.checkForUpdate(false); }, this.initialDelayMs);
    this._timer = setInterval(function () { self.checkForUpdate(false); }, this.autoAttemptIntervalMs);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') self.checkForUpdate(false);
    });
  };

  AlohaUpdateChecker.prototype.stop = function () {
    if (this._timer) clearInterval(this._timer);
    this._timer = 0;
  };

  AlohaUpdateChecker.prototype.checkForUpdate = function (force) {
    var self = this;
    if (this._checking) return Promise.resolve();
    var now = Date.now();
    if (!force) {
      var lastAttempt = parseInt(localStorage.getItem(LS_LAST_ATTEMPT) || '0', 10) || 0;
      var lastSuccess = parseInt(localStorage.getItem(LS_LAST_SUCCESS) || '0', 10) || 0;
      if (now - lastAttempt < this.autoAttemptIntervalMs) return Promise.resolve();
      if (now - lastSuccess < this.autoSuccessIntervalMs) return Promise.resolve();
    }
    this._checking = true;
    try { localStorage.setItem(LS_LAST_ATTEMPT, String(now)); } catch (_) {}
    return fetchLatestFromApi().then(function (release) {
      if (!release || !release.tag) {
        if (force) self._showUpToDate();
        return;
      }
      var newer = compareVersions(release.tag, currentVersion()) > 0;
      if (!newer) {
        try { localStorage.setItem(LS_LAST_SUCCESS, String(now)); } catch (_) {}
        if (force) self._showUpToDate(release);
        return;
      }
      try { localStorage.setItem(LS_LAST_SUCCESS, String(now)); } catch (_) {}
      var skipped = null;
      try { skipped = localStorage.getItem(LS_SKIP); } catch (_) {}
      if (!force && skipped && compareVersions(release.tag, skipped) <= 0) return;
      self._showUpdateModal(release);
    }).catch(function (err) {
      try { console.warn('[AlohaUpdateChecker] check failed:', (err && err.message) || err); } catch (_) {}
      if (isRateLimit(err)) return self._handleRateLimit(force, now);
      if (force) self._showError(false);
    }).finally(function () {
      self._checking = false;
    });
  };

  AlohaUpdateChecker.prototype._handleRateLimit = function (force, now) {
    var self = this;
    return fetchLatestTag().then(function (tagRelease) {
      if (tagRelease && compareVersions(tagRelease.tag, currentVersion()) > 0) {
        try { localStorage.setItem(LS_LAST_SUCCESS, String(now)); } catch (_) {}
        var skipped = null;
        try { skipped = localStorage.getItem(LS_SKIP); } catch (_) {}
        if (!force && skipped && compareVersions(tagRelease.tag, skipped) <= 0) return;
        tagRelease.rateLimited = true;
        self._showUpdateModal(tagRelease);
        return;
      }
      if (force) self._showError(true);
    }).catch(function () {
      if (force) self._showError(true);
    });
  };

  AlohaUpdateChecker.prototype._ensureModal = function () {
    if (this._modal) return this._modal;
    var modal = document.createElement('div');
    modal.className = 'aloha-modal';
    modal.id = 'alohaUpdateModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.hidden = true;
    modal.innerHTML =
      '<div class="aloha-modal-card">' +
      '<div class="aloha-modal-head"><h3 id="alohaUpdateTitle"></h3></div>' +
      '<div class="aloha-modal-body" id="alohaUpdateBody"></div>' +
      '<div class="aloha-modal-foot" id="alohaUpdateFoot"></div>' +
      '</div>';
    document.body.appendChild(modal);
    this._modal = modal;
    return modal;
  };

  AlohaUpdateChecker.prototype._close = function () {
    if (this._modal) this._modal.hidden = true;
  };

  AlohaUpdateChecker.prototype._btn = function (label, onClick, primary) {
    var b = document.createElement('button');
    b.className = primary ? 'aloha-btn aloha-btn-primary' : 'aloha-btn';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };

  AlohaUpdateChecker.prototype._linkBtn = function (label, href, primary) {
    var a = document.createElement('a');
    a.className = primary ? 'aloha-btn aloha-btn-primary' : 'aloha-btn';
    a.textContent = label;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  };

  AlohaUpdateChecker.prototype._showUpToDate = function () {
    var modal = this._ensureModal();
    var self = this;
    modal.querySelector('#alohaUpdateTitle').textContent = 'You are up to date';
    var body = modal.querySelector('#alohaUpdateBody');
    body.innerHTML = '';
    var p = document.createElement('p');
    p.textContent = 'Aloha v' + currentVersion() + ' is the latest version.';
    body.appendChild(p);
    var foot = modal.querySelector('#alohaUpdateFoot');
    foot.innerHTML = '';
    foot.appendChild(this._btn('Close', function () { self._close(); }, true));
    modal.hidden = false;
  };

  AlohaUpdateChecker.prototype._showError = function (rateLimited) {
    var modal = this._ensureModal();
    var self = this;
    modal.querySelector('#alohaUpdateTitle').textContent = 'Update check failed';
    var body = modal.querySelector('#alohaUpdateBody');
    body.innerHTML = '';
    var p = document.createElement('p');
    p.textContent = rateLimited
      ? 'GitHub is limiting update checks from your network right now. Please try again in a little while.'
      : 'Could not reach GitHub. Check your internet connection and try again.';
    body.appendChild(p);
    var foot = modal.querySelector('#alohaUpdateFoot');
    foot.innerHTML = '';
    foot.appendChild(this._btn('Retry', function () {
      self._close();
      self.checkForUpdate(true);
    }, true));
    foot.appendChild(this._btn('Close', function () { self._close(); }, false));
    modal.hidden = false;
  };

  AlohaUpdateChecker.prototype._showUpdateModal = function (release) {
    var modal = this._ensureModal();
    var self = this;
    modal.querySelector('#alohaUpdateTitle').textContent = 'Update available';
    var body = modal.querySelector('#alohaUpdateBody');
    body.innerHTML = '';

    var versions = document.createElement('p');
    versions.className = 'aloha-update-versions';
    versions.textContent = 'Installed: v' + currentVersion() + ' · Latest: ' + release.tag;
    body.appendChild(versions);

    if (release.rateLimited) {
      var notice = document.createElement('p');
      notice.className = 'aloha-update-ratelimited';
      notice.textContent = 'GitHub is limiting update checks — showing the version number only. Retry later for release notes and the direct download.';
      body.appendChild(notice);
    }

    if (release.name) {
      var name = document.createElement('h4');
      name.textContent = release.name;
      body.appendChild(name);
    }
    var notesTitle = document.createElement('h4');
    notesTitle.textContent = 'Release notes';
    body.appendChild(notesTitle);
    var notes = document.createElement('div');
    notes.className = 'aloha-update-notes';
    notes.textContent = release.notes || 'No release notes provided.';
    body.appendChild(notes);

    var foot = modal.querySelector('#alohaUpdateFoot');
    foot.innerHTML = '';
    var downloadUrl = release.apkUrl || release.htmlUrl;
    var download = this._linkBtn('Download update', downloadUrl, true);
    download.addEventListener('click', function () { self._close(); });
    foot.appendChild(download);
    var page = this._linkBtn('Release page', release.htmlUrl, false);
    page.addEventListener('click', function () { self._close(); });
    foot.appendChild(page);
    var skip = this._btn('Skip this version', function () {
      try { localStorage.setItem(LS_SKIP, release.tag); } catch (_) {}
      self._close();
    }, false);
    foot.appendChild(skip);
    modal.hidden = false;
  };

  window.AlohaUpdateChecker = AlohaUpdateChecker;
})();
