/* =========================================================
 * 善通寺市災害ボランティアセンター 特設ページ
 * GAS Webアプリ(doGet)からJSONPで設定を取得し、DOMに描画する。
 *
 * 【設定】GAS_URL に GAS Webアプリの /exec URL を貼り付けること。
 * (再デプロイは必ず「デプロイを管理」から既存デプロイの
 *  バージョン更新で行うこと。新規デプロイはURLが変わる)
 * ========================================================= */
(function () {
  'use strict';

  var CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/【https://script.google.com/macros/s/AKfycbyYDGs4tcZndrjMrdv0WQTVF4Dh0_Rj1WyBLzYk7ZwsLw6Kop22jctvZRG9Gt2Vbb2V/exec】/exec',
    TIMEOUT_MS: 15000,           // この時間内に応答がなければエラー表示
    CALLBACK_NAME: 'vcPageRender'
  };

  // ---------- ユーティリティ ----------

  function $(id) { return document.getElementById(id); }

  /** settingsから値を取り出す(なければ空文字) */
  function getVal(settings, key) {
    var item = settings && settings[key];
    if (!item) return '';
    var v = item.value;
    return (v === null || v === undefined) ? '' : String(v).trim();
  }

  /** 複数行テキストを安全に描画(innerHTMLは使わない) */
  function setMultiline(el, text) {
    el.textContent = '';
    var lines = String(text).split(/\r?\n/);
    lines.forEach(function (line) {
      var p = document.createElement('p');
      p.textContent = line;
      el.appendChild(p);
    });
  }

  /** http(s)のURLのみ許可 */
  function isSafeUrl(url) {
    return /^https?:\/\//i.test(String(url).trim());
  }

  /** リンク集をulに描画 */
  function renderLinks(listEl, links) {
    listEl.textContent = '';
    var count = 0;
    (links || []).forEach(function (link) {
      if (!link || !link.name || !isSafeUrl(link.url)) return;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = link.name;
      li.appendChild(a);
      listEl.appendChild(li);
      count++;
    });
    return count;
  }

  // ---------- 描画本体 ----------

  function render(data) {
    var settings = (data && data.settings) || {};
    var links = (data && data.links) || [];

    document.body.classList.remove('is-loading');
    $('view-loading').hidden = true;

    var mode = getVal(settings, 'mode');

    if (mode !== '有事') {
      renderNormalView(settings, links);
    } else {
      renderActiveView(settings, links);
    }

    // フッター:最終更新日時
    var updated = latestUpdatedAt(settings);
    if (updated) {
      $('last-updated').textContent = '最終更新:' + updated;
    }
    $('copyright-year').textContent = String(new Date().getFullYear());
  }

  /** 設定シート内の更新日時の最大値を返す */
  function latestUpdatedAt(settings) {
    var latest = '';
    Object.keys(settings).forEach(function (key) {
      var u = settings[key].updatedAt || '';
      if (u > latest) latest = u;
    });
    return latest;
  }

  // ---------- 平常時表示 ----------

  function renderNormalView(settings, links) {
    $('view-normal').hidden = false;

    var msg = getVal(settings, 'normal_message') ||
      '大規模な災害が発生した際に、このページでボランティア募集などの情報をお知らせします。';
    $('normal-message').textContent = msg;

    var count = renderLinks($('normal-links-list'), links);
    $('normal-links-section').hidden = (count === 0);
  }

  // ---------- 有事表示 ----------

  function renderActiveView(settings, links) {
    $('view-active').hidden = false;

    // 開設状況バナー
    var status = getVal(settings, 'center_status');
    var banner = $('status-banner');
    var statusClass = {
      '開設中': 'status-banner--open',
      '準備中': 'status-banner--preparing',
      '終了': 'status-banner--closed'
    }[status] || 'status-banner--preparing';
    banner.classList.add(statusClass);
    $('status-value').textContent = status || '準備中';
    $('status-message').textContent = getVal(settings, 'status_message');

    // お知らせ帯
    var notice = getVal(settings, 'notice');
    if (notice) {
      $('notice-text').textContent = notice;
      $('notice-band').hidden = false;
    }

    // 募集状況・活動内容
    var recruitStatus = getVal(settings, 'recruit_status');
    var activity = getVal(settings, 'activity_content');
    if (recruitStatus || activity) {
      $('recruit-status').textContent = recruitStatus;
      setMultiline($('activity-content'), activity);
      $('recruit-section').hidden = false;
    }

    // 事前受付フォーム
    var formUrl = getVal(settings, 'form_url');
    var formOpen = getVal(settings, 'form_open');
    if (isSafeUrl(formUrl)) {
      $('form-section').hidden = false;
      if (formOpen === '受付中') {
        $('form-button').href = formUrl;
      } else {
        $('form-guide').hidden = true;
        $('form-button').hidden = true;
        $('form-closed').hidden = false;
      }
    }

    // 持ち物・服装
    var items = getVal(settings, 'items_notice');
    if (items) {
      setMultiline($('items-notice'), items);
      $('items-section').hidden = false;
    }

    // ボランティア保険
    var insuranceUrl = getVal(settings, 'insurance_url');
    if (isSafeUrl(insuranceUrl)) {
      $('insurance-button').href = insuranceUrl;
      var label = getVal(settings, 'insurance_label');
      if (label) $('insurance-button').textContent = label;
      $('insurance-section').hidden = false;
    }

    // リンク集
    var count = renderLinks($('links-list'), links);
    $('links-section').hidden = (count === 0);

    // お問い合わせ
    var tel = getVal(settings, 'contact_tel');
    if (tel) {
      $('contact-tel').textContent = tel;
      $('contact-tel').href = 'tel:' + tel.replace(/[^0-9+]/g, '');
      $('contact-tel-wrap').hidden = false;
    }
    $('contact-hours').textContent = getVal(settings, 'contact_hours');
  }

  // ---------- エラー表示 ----------

  function showError() {
    document.body.classList.remove('is-loading');
    $('view-loading').hidden = true;
    $('view-error').hidden = false;
  }

  // ---------- JSONP読み込み ----------

  function loadData() {
    var done = false;
    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      showError();
    }, CONFIG.TIMEOUT_MS);

    window[CONFIG.CALLBACK_NAME] = function (data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        render(data);
      } catch (e) {
        showError();
      }
    };

    var script = document.createElement('script');
    script.src = CONFIG.GAS_URL +
      '?callback=' + CONFIG.CALLBACK_NAME +
      '&_=' + Date.now(); // キャッシュ回避
    script.onerror = function () {
      if (done) return;
      done = true;
      clearTimeout(timer);
      showError();
    };
    document.body.appendChild(script);
  }

  loadData();
})();
