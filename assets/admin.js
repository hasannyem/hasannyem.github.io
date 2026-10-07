(function () {
  'use strict';
  var S = window.Site;
  var db = S.db;
  var E = S.esc;
  var app = document.getElementById('app');

  function $(id) {
    return document.getElementById(id);
  }
  function today() {
    return new Date().toLocaleDateString('en-CA');
  }
  function dayKey(iso) {
    return new Date(iso).toLocaleDateString('en-CA');
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function when(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function mailOk(s) {
    return /^[^\s<>"'&]+@[^\s<>"'&]+\.[^\s<>"'&]+$/.test(s || '');
  }

  var state = {
    tab: 'dashboard',
    content: {},
    dirty: {},
    open: {},
    user: null,
    editingPost: null,
    filters: { comments: 'pending', guests: 'pending' },
    imgMode: 'insert',
    snap: {}
  };

  // Section definitions -------------------------------------------------------

  var STATUS_OPTIONS = [
    ['published', 'Published'],
    ['accepted', 'Accepted'],
    ['under_review', 'Under Review'],
    ['submitted', 'Submitted'],
    ['in_preparation', 'In Preparation']
  ];

  var SECTIONS = {
    profile: {
      label: 'Profile & contact',
      kind: 'object',
      help: 'Your name, photo, bio and contact details. They appear in the hero card, the contact section and the footer.',
      fields: [
        { k: 'name', l: 'Full name', t: 'text', hint: 'Used for the page title and the footer.' },
        { k: 'display_name', l: 'Name in the big heading', t: 'text', hint: 'The first word is shown in the accent colour. Leave empty to use the full name without "Md".' },
        { k: 'role_line', l: 'Role line under the heading', t: 'text', hint: 'For example: AI & Machine Learning Engineer. Leave empty to hide.' },
        { k: 'short_name', l: 'Short name (top menu)', t: 'text', hint: 'Shown as text when no logo is set.' },
        { k: 'logo', l: 'Logo (top left)', t: 'text', hint: 'File name in the repository (logo.png) or a full https link. Leave empty to show the short name as text.' },
        { k: 'title', l: 'Title in the info card', t: 'text' },
        { k: 'eyebrow', l: 'Small line above the heading', t: 'text' },
        { k: 'location', l: 'Location', t: 'text' },
        { k: 'badge', l: 'Badge text', t: 'text', hint: 'For example: Open to MS / PhD Positions. Leave empty to hide.' },
        { k: 'photo', l: 'Photo', t: 'text', hint: 'File name in the repository (ProfilePhoto.jpg) or a full https link.' },
        { k: 'bio', l: 'About text', t: 'lines', rows: 8, hint: 'One paragraph per line.' },
        { k: 'tags', l: 'Highlight tags', t: 'tags', hint: 'Separate with commas.' },
        { k: 'cv_url', l: 'CV link', t: 'text' },
        { k: 'email', l: 'Email', t: 'text' },
        { k: 'phone', l: 'Phone', t: 'text' },
        { k: 'address', l: 'Address', t: 'text' },
        { k: 'socials', l: 'Social links', t: 'socials' },
        { k: 'contact_intro', l: 'Text above the contact form', t: 'textarea' },
        { k: 'footer_note', l: 'Footer note', t: 'text', hint: 'The year is added automatically.' }
      ]
    },
    news: {
      label: 'News',
      kind: 'list',
      addAt: 'start',
      help: 'Short updates shown at the top of the site, newest first. The section hides itself when the list is empty.',
      title: function (i) {
        return (i.date || '') + '  ' + String(i.text || '').slice(0, 70);
      },
      blank: function () {
        return { date: today(), text: '', link: '', link_label: '' };
      },
      fields: [
        { k: 'date', l: 'Date', t: 'date' },
        { k: 'link_label', l: 'Link text', t: 'text', hint: 'Default: Read more' },
        { k: 'text', l: 'News', t: 'textarea', rows: 3 },
        { k: 'link', l: 'Link (optional)', t: 'text', w: 'full' }
      ]
    },
    research: {
      label: 'Research experience',
      kind: 'list',
      addAt: 'start',
      title: function (i) {
        return (i.role || '') + ' · ' + (i.topic || '');
      },
      blank: function () {
        return { period: '', role: '', topic: '', supervisor: '', supervisor_url: '', points: [], cert_url: '' };
      },
      fields: [
        { k: 'period', l: 'Period', t: 'text', hint: 'For example: July 2025 – Present' },
        { k: 'role', l: 'Role', t: 'text' },
        { k: 'topic', l: 'Topic', t: 'text' },
        { k: 'supervisor', l: 'Supervisor / organisation', t: 'text' },
        { k: 'supervisor_url', l: 'Organisation link (optional)', t: 'text' },
        { k: 'cert_url', l: 'Certificate link (optional)', t: 'text' },
        { k: 'points', l: 'Bullet points', t: 'lines', hint: 'One point per line.' }
      ]
    },
    interests: {
      label: 'Research interests',
      kind: 'list',
      addAt: 'end',
      title: function (i) {
        return (i.icon || '') + ' ' + (i.name || '');
      },
      blank: function () {
        return { icon: '', name: '' };
      },
      fields: [
        { k: 'icon', l: 'Icon (an emoji)', t: 'text' },
        { k: 'name', l: 'Name', t: 'text' }
      ]
    },
    publications: {
      label: 'Publications',
      kind: 'list',
      addAt: 'end',
      help: 'Numbers are added automatically from the order of this list. Use the arrows to reorder. Every link you fill in (DOI, Journal, Submission Proof) is shown under the paper.',
      title: function (i) {
        return (i.title || '') + '  [' + (i.status || '') + ']';
      },
      blank: function () {
        return { title: '', authors: '', venue: '', index_tag: '', publisher: '', doi: '', journal_url: '', proof_url: '', status: 'submitted' };
      },
      fields: [
        { k: 'title', l: 'Title', t: 'textarea', rows: 2 },
        { k: 'authors', l: 'Authors', t: 'textarea', rows: 2 },
        { k: 'venue', l: 'Journal / conference', t: 'text' },
        { k: 'status', l: 'Status', t: 'select', options: STATUS_OPTIONS },
        { k: 'index_tag', l: 'Index badge (optional)', t: 'text', hint: 'For example: SCOPUS, IEEE' },
        { k: 'publisher', l: 'Publisher (optional)', t: 'text' },
        { k: 'doi', l: 'DOI (optional)', t: 'text', hint: 'Only the DOI, for example 10.1109/XXXX' },
        { k: 'journal_url', l: 'Journal link (optional)', t: 'text', hint: 'Link to the paper or journal page. Shown as "Journal".' },
        { k: 'proof_url', l: 'Submission proof link (optional)', t: 'text', hint: 'Shown as "Submission Proof".' }
      ]
    },
    skills: {
      label: 'Skills',
      kind: 'list',
      addAt: 'end',
      title: function (i) {
        return i.title || '';
      },
      blank: function () {
        return { title: '', items: [] };
      },
      fields: [
        { k: 'title', l: 'Group title', t: 'text', w: 'full' },
        { k: 'items', l: 'Skills', t: 'lines', rows: 8, hint: 'One per line. Start a line with * to highlight it.' }
      ]
    },
    experience: {
      label: 'Professional experience',
      kind: 'list',
      addAt: 'start',
      help: 'Newest first. Cards alternate left and right on wide screens.',
      title: function (i) {
        return (i.role || '') + ' · ' + (i.company || '');
      },
      blank: function () {
        return { period: '', role: '', company: '', points: [], tags: [] };
      },
      fields: [
        { k: 'period', l: 'Period', t: 'text' },
        { k: 'role', l: 'Role', t: 'text' },
        { k: 'company', l: 'Company and place', t: 'text', w: 'full' },
        { k: 'points', l: 'Bullet points', t: 'lines', hint: 'One point per line.' },
        { k: 'tags', l: 'Tags', t: 'tags', hint: 'Separate with commas.' }
      ]
    },
    education: {
      label: 'Education',
      kind: 'list',
      addAt: 'start',
      title: function (i) {
        return (i.degree || '') + ' · ' + (i.period || '');
      },
      blank: function () {
        return { icon: 'cap', degree: '', school: '', period: '', cgpa: '', thesis: '' };
      },
      fields: [
        {
          k: 'icon',
          l: 'Icon',
          t: 'select',
          options: [
            ['cap', 'Graduation cap'],
            ['book', 'Book'],
            ['home', 'School']
          ]
        },
        { k: 'period', l: 'Period', t: 'text' },
        { k: 'degree', l: 'Degree', t: 'text', w: 'full' },
        { k: 'school', l: 'Institution', t: 'text', w: 'full' },
        { k: 'cgpa', l: 'Result', t: 'text' },
        { k: 'thesis', l: 'Thesis (optional)', t: 'text' }
      ]
    },
    training: {
      label: 'Training & certificates',
      kind: 'list',
      addAt: 'end',
      title: function (i) {
        return (i.year || '') + '  ' + (i.title || '');
      },
      blank: function () {
        return { year: '', title: '', org: '', period: '', points: [], cert_url: '' };
      },
      fields: [
        { k: 'year', l: 'Year', t: 'text' },
        { k: 'period', l: 'Period', t: 'text' },
        { k: 'title', l: 'Course title', t: 'text', w: 'full' },
        { k: 'org', l: 'Organisation', t: 'text', w: 'full' },
        { k: 'points', l: 'Bullet points', t: 'lines', hint: 'One point per line.' },
        { k: 'cert_url', l: 'Certificate link (optional)', t: 'text' }
      ]
    }
  };

  var SOC_TYPES = [
    ['linkedin', 'LinkedIn'],
    ['scholar', 'Google Scholar'],
    ['github', 'GitHub'],
    ['researchgate', 'ResearchGate'],
    ['orcid', 'ORCID'],
    ['facebook', 'Facebook'],
    ['instagram', 'Instagram'],
    ['x', 'X (Twitter)'],
    ['youtube', 'YouTube'],
    ['telegram', 'Telegram'],
    ['whatsapp', 'WhatsApp'],
    ['website', 'Website'],
    ['other', 'Other link']
  ];

  var NEWS_FIELDS = [
    { k: 'show_in_news', l: 'Show in News', t: 'check', hint: 'Tick to list this item in the News box on the home page.' },
    { k: 'news_date', l: 'News date', t: 'date', hint: 'Used to sort the News box. Filled in automatically when you tick the box.' },
    { k: 'news_text', l: 'News headline (optional)', t: 'text', w: 'full', hint: 'Leave empty to use an automatic headline.' }
  ];
  ['research', 'publications', 'experience', 'education', 'training'].forEach(function (key) {
    var cfg = SECTIONS[key];
    var blank = cfg.blank;
    cfg.fields = cfg.fields.concat(NEWS_FIELDS);
    cfg.blank = function () {
      var o = blank();
      o.show_in_news = false;
      o.news_date = '';
      o.news_text = '';
      return o;
    };
  });

  var NAV = [
    { k: 'dashboard', l: 'Dashboard', g: 'Overview' },
    { k: 'profile', l: 'Profile & contact', g: 'Website content' },
    { k: 'news', l: 'News', g: 'Website content' },
    { k: 'research', l: 'Research experience', g: 'Website content' },
    { k: 'interests', l: 'Research interests', g: 'Website content' },
    { k: 'publications', l: 'Publications', g: 'Website content' },
    { k: 'skills', l: 'Skills', g: 'Website content' },
    { k: 'experience', l: 'Experience', g: 'Website content' },
    { k: 'education', l: 'Education', g: 'Website content' },
    { k: 'training', l: 'Training', g: 'Website content' },
    { k: 'posts', l: 'Blog posts', g: 'Blog' },
    { k: 'comments', l: 'Comments', g: 'Blog' },
    { k: 'guests', l: 'Guest posts', g: 'Blog' },
    { k: 'messages', l: 'Messages', g: 'Inbox' },
    { k: 'backup', l: 'Backup', g: 'Other' }
  ];

  // Helpers -----------------------------------------------------------------------

  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(function () {
      t.remove();
    }, kind === 'err' ? 8000 : 5000);
  }

  function fieldHTML(f, val, idx) {
    var a = ' data-k="' + f.k + '" data-t="' + f.t + '"' + (idx != null ? ' data-i="' + idx + '"' : '');
    var cls = 'fld' + (f.t === 'textarea' || f.t === 'lines' || f.w === 'full' ? ' full' : '');
    var hint = f.hint ? '<small>' + E(f.hint) + '</small>' : '';
    var inner;
    if (f.t === 'check') {
      return '<label class="fld full" style="flex-direction:row;align-items:center;gap:10px;"><input type="checkbox"' + a + (val ? ' checked' : '') + '/><b style="font-weight:500;">' + E(f.l) + '</b>' + (f.hint ? '<small>' + E(f.hint) + '</small>' : '') + '</label>';
    }
    if (f.t === 'socials') {
      var rows = (Array.isArray(val) ? val : [])
        .map(function (r, n) {
          return (
            '<div class="soc-row">' +
            '<select data-soc="type" data-si="' + n + '">' +
            SOC_TYPES.map(function (o) {
              return '<option value="' + o[0] + '"' + (o[0] === r.type ? ' selected' : '') + '>' + E(o[1]) + '</option>';
            }).join('') +
            '</select>' +
            '<input type="text" data-soc="url" data-si="' + n + '" placeholder="https://" value="' + E(r.url || '') + '"/>' +
            '<button class="btn small danger" type="button" data-act="soc-del" data-si="' + n + '">Remove</button></div>'
          );
        })
        .join('');
      return (
        '<div class="fld full"><span>' + E(f.l) + '</span><div class="soc-list">' + (rows || '<small>No links yet.</small>') + '</div>' +
        '<div><button class="btn small" type="button" data-act="soc-add">+ Add link</button></div>' +
        '<small>Shown as round icons in the card under your photo, in this order. Links must start with https://</small></div>'
      );
    }
    if (f.t === 'textarea' || f.t === 'lines') {
      var v = f.t === 'lines' ? (Array.isArray(val) ? val.join('\n') : '') : val || '';
      inner = '<textarea rows="' + (f.rows || (f.t === 'lines' ? 4 : 3)) + '"' + a + '>' + E(v) + '</textarea>';
    } else if (f.t === 'select') {
      inner =
        '<select' + a + '>' +
        f.options
          .map(function (o) {
            return '<option value="' + E(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + E(o[1]) + '</option>';
          })
          .join('') +
        '</select>';
    } else if (f.t === 'tags') {
      inner = '<input type="text"' + a + ' value="' + E(Array.isArray(val) ? val.join(', ') : '') + '"/>';
    } else {
      inner = '<input type="' + (f.t === 'date' ? 'date' : 'text') + '"' + a + ' value="' + E(val || '') + '"/>';
    }
    return '<label class="' + cls + '"><span>' + E(f.l) + '</span>' + inner + hint + '</label>';
  }

  function readVal(el) {
    switch (el.dataset.t) {
      case 'check':
        return !!el.checked;
      case 'lines':
        return el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      case 'tags':
        return el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      default:
        return el.value;
    }
  }

  function anyDirty() {
    return Object.keys(state.dirty).some(function (k) {
      return state.dirty[k];
    });
  }

  function markDirty(key) {
    state.dirty[key] = true;
    var b = $('saveBtn');
    if (b) b.textContent = 'Save changes *';
  }

  // Auth ---------------------------------------------------------------------------

  function login() {
    db.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: location.origin + location.pathname } });
  }

  async function signOut() {
    if (anyDirty() && !confirm('You have unsaved changes. Sign out anyway?')) return;
    state.dirty = {};
    await db.auth.signOut();
    location.reload();
  }

  function renderLogin(msg) {
    app.innerHTML =
      '<div class="center-screen"><div class="login-card"><h1>Site admin</h1><p>' +
      E(msg || 'Sign in with the GitHub account that owns this site.') +
      '</p><button class="btn primary" data-act="login">Sign in with GitHub</button></div></div>';
  }

  function renderDenied(session) {
    var meta = session.user.user_metadata || {};
    app.innerHTML =
      '<div class="center-screen"><div class="login-card"><h1>Not an admin yet</h1><p>You are signed in as <strong>' +
      E(meta.user_name || meta.name || session.user.email || 'this account') +
      '</strong>, but this account is not in the admins table. If this is you, run supabase/make_admin.sql once in the Supabase SQL editor, then reload this page.</p>' +
      '<button class="btn" data-act="signout">Sign out</button></div></div>';
  }

  // Shell -----------------------------------------------------------------------------

  function renderShell() {
    var meta = state.user.user_metadata || {};
    var who = meta.user_name || meta.name || state.user.email || '';
    var nav = '';
    var last = '';
    NAV.forEach(function (n) {
      if (n.g !== last) {
        nav += '<div class="group">' + E(n.g) + '</div>';
        last = n.g;
      }
      nav += '<button data-act="go" data-tab="' + n.k + '" id="nav-' + n.k + '">' + E(n.l) + '<span class="badge" id="badge-' + n.k + '"></span></button>';
    });
    app.innerHTML =
      '<div class="topbar"><h2>Site admin</h2><div class="right"><a href="index.html" target="_blank" rel="noopener">View site</a><span>' +
      E(who) + '</span><button class="btn small" data-act="signout">Sign out</button></div></div>' +
      '<div class="layout"><nav class="side">' + nav + '</nav><main id="main"></main></div>';
  }

  function go(tab) {
    if (state.dirty[state.tab]) {
      if (!confirm('You have unsaved changes on this page. Leave without saving?')) return;
      state.dirty[state.tab] = false;
      if (SECTIONS[state.tab] && state.snap[state.tab] !== undefined) state.content[state.tab] = clone(state.snap[state.tab]);
    }
    state.tab = tab;
    state.editingPost = null;
    render();
  }

  function render() {
    document.querySelectorAll('.side button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === state.tab);
    });
    var t = state.tab;
    if (t === 'dashboard') return renderDashboard();
    if (SECTIONS[t]) return renderSection(t);
    if (t === 'posts') return renderPosts();
    if (t === 'comments') return renderComments();
    if (t === 'guests') return renderGuests();
    if (t === 'messages') return renderMessages();
    if (t === 'backup') return renderBackup();
  }

  async function refreshBadges() {
    var qs = [
      ['comments', db.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending')],
      ['guests', db.from('guest_posts').select('id', { count: 'exact', head: true }).eq('status', 'pending')],
      ['messages', db.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false)]
    ];
    var res = await Promise.all(
      qs.map(function (q) {
        return q[1];
      })
    );
    res.forEach(function (r, i) {
      var el = $('badge-' + qs[i][0]);
      if (el) el.textContent = r.count ? String(r.count) : '';
    });
  }

  // Website sections --------------------------------------------------------------------------

  function renderSection(key) {
    var cfg = SECTIONS[key];
    var main = $('main');
    var head =
      '<div class="page-head"><h1>' + E(cfg.label) + '</h1><button class="btn primary" id="saveBtn" data-act="save" data-key="' + key + '">' +
      (state.dirty[key] ? 'Save changes *' : 'Save') + '</button></div>' +
      (cfg.help ? '<p class="help">' + E(cfg.help) + '</p>' : '');

    if (cfg.kind === 'object') {
      var obj = state.content[key] || {};
      state.content[key] = obj;
      main.innerHTML =
        head + '<div class="card"><div class="grid">' +
        cfg.fields.map(function (f) { return fieldHTML(f, obj[f.k], null); }).join('') +
        '</div></div>';
      return;
    }

    var list = Array.isArray(state.content[key]) ? state.content[key] : [];
    state.content[key] = list;
    var items = list
      .map(function (it, i) {
        var open = state.open[key + ':' + i];
        return (
          '<div class="item' + (open ? ' open' : '') + '" id="item-' + i + '">' +
          '<div class="item-head"><button class="item-title" data-act="toggle" data-i="' + i + '" data-key="' + key + '">' + (i + 1) + '. ' + E(cfg.title(it) || '(empty)') + '</button>' +
          '<span class="tools"><button data-act="up" data-i="' + i + '" data-key="' + key + '" title="Move up">↑</button>' +
          '<button data-act="down" data-i="' + i + '" data-key="' + key + '" title="Move down">↓</button>' +
          '<button class="danger" data-act="del" data-i="' + i + '" data-key="' + key + '">Delete</button></span></div>' +
          '<div class="item-body"><div class="grid">' +
          cfg.fields.map(function (f) { return fieldHTML(f, it[f.k], i); }).join('') +
          '</div></div></div>'
        );
      })
      .join('');
    main.innerHTML =
      head +
      '<div class="toolbar"><button class="btn" data-act="add" data-key="' + key + '">+ Add new</button><span class="hint">' + list.length + ' item' + (list.length === 1 ? '' : 's') + '. Click a title to edit it.</span></div>' +
      (items || '<p class="empty">Nothing here yet.</p>');
  }

  async function saveSection(key) {
    var btn = $('saveBtn');
    if (btn) btn.disabled = true;
    var res = await db.from('site_content').upsert({ key: key, value: state.content[key], updated_at: new Date().toISOString() });
    if (btn) btn.disabled = false;
    if (res.error) {
      toast('Save failed: ' + res.error.message, 'err');
      return;
    }
    state.dirty[key] = false;
    state.snap[key] = clone(state.content[key]);
    if (btn) btn.textContent = 'Save';
    toast('Saved. The live site shows it on the next page load.', 'ok');
  }

  function sectionAction(act, el) {
    var key = el.dataset.key;
    var cfg = SECTIONS[key];
    var list = state.content[key];
    var i = Number(el.dataset.i);
    if (act === 'toggle') {
      var item = $('item-' + i);
      var open = item.classList.toggle('open');
      state.open[key + ':' + i] = open;
      return;
    }
    if (act === 'add') {
      var fresh = cfg.blank();
      var at;
      if (cfg.addAt === 'start') {
        list.unshift(fresh);
        at = 0;
      } else {
        list.push(fresh);
        at = list.length - 1;
      }
      state.open = {};
      state.open[key + ':' + at] = true;
      markDirty(key);
      renderSection(key);
      var node = $('item-' + at);
      if (node) node.scrollIntoView({ block: 'center' });
      return;
    }
    if (act === 'up' || act === 'down') {
      var j = act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
      state.open = {};
      state.open[key + ':' + j] = true;
      markDirty(key);
      renderSection(key);
      return;
    }
    if (act === 'del') {
      if (!confirm('Delete this item? It is removed from the site when you press Save.')) return;
      list.splice(i, 1);
      state.open = {};
      markDirty(key);
      renderSection(key);
    }
  }

  // Blog posts ----------------------------------------------------------------------------------

  async function prepareImage(file) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Please choose a JPG, PNG, WebP or GIF image.');
    if (file.size > 10 * 1024 * 1024) throw new Error('That image is larger than 10 MB.');
    if (file.type === 'image/gif' || file.size < 350 * 1024) return file;
    try {
      var bmp = await createImageBitmap(file);
      var sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * sc);
      c.height = Math.round(bmp.height * sc);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      var blob = await new Promise(function (r) {
        c.toBlob(r, 'image/jpeg', 0.85);
      });
      if (blob && blob.size < file.size) return new File([blob], 'image.jpg', { type: 'image/jpeg' });
    } catch (e) {}
    return file;
  }

  async function uploadImage(file) {
    var f = await prepareImage(file);
    var ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[f.type];
    var path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    var up = await db.storage.from('blog-images').upload(path, f, { cacheControl: '31536000', upsert: false, contentType: f.type });
    if (up.error) throw up.error;
    return db.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
  }

  async function renderPosts() {
    var main = $('main');
    if (state.editingPost) return renderPostEditor();
    main.innerHTML = '<div class="loading">Loading…</div>';
    var res = await db.from('posts').select('*').order('created_at', { ascending: false });
    if (state.tab !== 'posts' || state.editingPost) return;
    if (res.error) {
      main.innerHTML = '<p class="empty">Could not load posts: ' + E(res.error.message) + '</p>';
      return;
    }
    var rows = res.data
      .map(function (p) {
        return (
          '<div class="entry"><div class="entry-head"><span><strong>' + E(p.title) + '</strong>' +
          '<span class="chip">' + E(p.category) + '</span>' +
          '<span class="chip ' + (p.published ? 'live' : 'draft') + '">' + (p.published ? 'published' : 'draft') + '</span>' +
          (p.is_guest ? '<span class="chip">guest: ' + E(p.author_name) + '</span>' : '') +
          '</span><span>' + S.fmtDate(p.created_at) + '</span></div>' +
          '<div class="entry-actions"><button class="btn small" data-act="post-edit" data-id="' + E(p.id) + '">Edit</button>' +
          '<a class="btn small" target="_blank" rel="noopener" href="blog.html?post=' + encodeURIComponent(p.id) + '">View</a>' +
          '<button class="btn small danger" data-act="post-del" data-id="' + E(p.id) + '">Delete</button></div></div>'
        );
      })
      .join('');
    main.innerHTML =
      '<div class="page-head"><h1>Blog posts</h1><button class="btn primary" data-act="post-new">+ New post</button></div>' +
      (rows || '<p class="empty">No posts yet.</p>');
    state.postRows = res.data;
  }

  function renderPostEditor() {
    var p = state.editingPost;
    var main = $('main');
    main.innerHTML =
      '<div class="page-head"><h1>' + (p.id ? 'Edit post' : 'New post') + '</h1><div class="toolbar" style="margin:0">' +
      '<button class="btn" data-act="post-cancel">Cancel</button><button class="btn primary" data-act="post-save" id="postSave">Save post</button></div></div>' +
      '<div class="card"><div class="grid">' +
      '<label class="fld full"><span>Title</span><input type="text" id="pTitle" maxlength="200" value="' + E(p.title) + '"/></label>' +
      '<label class="fld"><span>Category</span><select id="pCat"><option value="tech"' + (p.category === 'tech' ? ' selected' : '') + '>Technology</option><option value="personal"' + (p.category === 'personal' ? ' selected' : '') + '>Personal</option></select></label>' +
      '<label class="fld"><span>Date</span><input type="date" id="pDate" value="' + E(p.date) + '"/></label>' +
      '<label class="fld full"><span>Cover image link (optional)</span><input type="text" id="pCover" value="' + E(p.cover_url) + '"/><small>Paste a link, or upload an image below and press "Use as cover".</small></label>' +
      '<label class="fld full"><span>Text</span><textarea id="pBody" rows="18">' + E(p.body) + '</textarea>' +
      '<small>Blank line = new paragraph. ## Heading, - list item, **bold**, [text](https://link). Images are added with the button below.</small></label>' +
      '<label class="fld"><span>Visibility</span><select id="pPub"><option value="1"' + (p.published ? ' selected' : '') + '>Published</option><option value="0"' + (!p.published ? ' selected' : '') + '>Draft (hidden)</option></select></label>' +
      '<label class="fld full" style="flex-direction:row;align-items:center;gap:10px;"><input type="checkbox" id="pNews"' + (p.show_in_news ? ' checked' : '') + '/><b style="font-weight:500;">Show in News</b><small>Lists this post in the News box on the home page.</small></label>' +
      '</div><div class="toolbar" style="margin:14px 0 0"><input type="file" id="pImgFile" accept="image/jpeg,image/png,image/webp,image/gif" hidden/>' +
      '<button class="btn" data-act="post-img" data-mode="insert">Upload image into text</button>' +
      '<button class="btn" data-act="post-img" data-mode="cover">Upload image as cover</button></div></div>';
  }

  async function savePost() {
    var p = state.editingPost;
    var title = $('pTitle').value.trim();
    if (!title) {
      toast('Please add a title.', 'err');
      return;
    }
    var row = {
      title: title,
      category: $('pCat').value,
      body: $('pBody').value,
      cover_url: $('pCover').value.trim(),
      published: $('pPub').value === '1',
      show_in_news: $('pNews').checked
    };
    var date = $('pDate').value;
    if (date && date !== p.date) row.created_at = new Date(date + 'T12:00:00').toISOString();
    $('postSave').disabled = true;
    var res = p.id ? await db.from('posts').update(row).eq('id', p.id) : await db.from('posts').insert(row);
    $('postSave').disabled = false;
    if (res.error) {
      toast('Save failed: ' + res.error.message, 'err');
      return;
    }
    toast('Post saved.', 'ok');
    state.dirty.posts = false;
    state.editingPost = null;
    renderPosts();
  }

  async function postImage(file) {
    if (!file) return;
    toast('Uploading image…');
    try {
      var url = await uploadImage(file);
      if (state.imgMode === 'cover') {
        $('pCover').value = url;
      } else {
        var ta = $('pBody');
        var pos = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + '\n\n![](' + url + ')\n\n' + ta.value.slice(pos);
      }
      toast('Image uploaded.', 'ok');
    } catch (e) {
      toast('Upload failed: ' + (e.message || e), 'err');
    }
  }

  // Comments --------------------------------------------------------------------------------------

  function filterBar(name, options) {
    return (
      '<div class="filter">' +
      options
        .map(function (o) {
          return '<button data-act="filter" data-name="' + name + '" data-f="' + o[0] + '" class="' + (state.filters[name] === o[0] ? 'active' : '') + '">' + E(o[1]) + '</button>';
        })
        .join('') +
      '</div>'
    );
  }

  async function renderComments() {
    var main = $('main');
    main.innerHTML = '<div class="loading">Loading…</div>';
    var f = state.filters.comments;
    var q = db.from('comments').select('*, posts(title)').order('created_at', { ascending: false }).limit(200);
    if (f !== 'all') q = q.eq('status', f);
    var res = await q;
    if (state.tab !== 'comments') return;
    var rows = (res.data || [])
      .map(function (c) {
        var av = c.avatar_url && /^https:\/\//.test(c.avatar_url) ? '<img class="avatar" src="' + E(c.avatar_url) + '" alt=""/>' : '';
        return (
          '<div class="entry"><div class="entry-head"><span>' + av + '<strong>' + E(c.author_name) + '</strong> on ' + E(c.posts ? c.posts.title : 'a deleted post') +
          '<span class="chip ' + c.status + '">' + c.status + '</span></span><span>' + when(c.created_at) + '</span></div>' +
          '<div class="entry-body">' + E(c.body) + '</div><div class="entry-actions">' +
          (c.status !== 'approved' ? '<button class="btn small primary" data-act="cmt-status" data-id="' + E(c.id) + '" data-s="approved">Approve</button>' : '') +
          (c.status === 'pending' ? '<button class="btn small" data-act="cmt-status" data-id="' + E(c.id) + '" data-s="rejected">Reject</button>' : '') +
          (c.status === 'approved' ? '<button class="btn small" data-act="cmt-status" data-id="' + E(c.id) + '" data-s="rejected">Hide</button>' : '') +
          '<button class="btn small danger" data-act="cmt-del" data-id="' + E(c.id) + '">Delete</button></div></div>'
        );
      })
      .join('');
    main.innerHTML =
      '<div class="page-head"><h1>Comments</h1></div>' +
      '<p class="help">New comments wait here. Only approved comments are visible on the site.</p>' +
      filterBar('comments', [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']]) +
      (res.error ? '<p class="empty">Could not load: ' + E(res.error.message) + '</p>' : rows || '<p class="empty">Nothing here.</p>');
  }

  // Guest posts -------------------------------------------------------------------------------------

  async function renderGuests() {
    var main = $('main');
    main.innerHTML = '<div class="loading">Loading…</div>';
    var f = state.filters.guests;
    var q = db.from('guest_posts').select('*').order('created_at', { ascending: false }).limit(100);
    if (f !== 'all') q = q.eq('status', f);
    var res = await q;
    if (state.tab !== 'guests') return;
    var rows = (res.data || [])
      .map(function (g) {
        var mail = g.email && mailOk(g.email) ? ' · <a href="mailto:' + E(g.email) + '">' + E(g.email) + '</a>' : '';
        return (
          '<div class="entry" id="g-' + E(g.id) + '"><div class="entry-head"><span><strong>' + E(g.name) + '</strong>' + mail +
          '<span class="chip ' + g.status + '">' + g.status + '</span></span><span>' + when(g.created_at) + '</span></div>' +
          '<input class="inp g-title" type="text" maxlength="200" value="' + E(g.title) + '"/>' +
          '<textarea class="inp g-body">' + E(g.body) + '</textarea>' +
          '<div class="entry-actions">' +
          (g.status !== 'approved' ? '<button class="btn small primary" data-act="g-approve" data-id="' + E(g.id) + '">Approve and publish</button>' : '') +
          (g.status === 'pending' ? '<button class="btn small" data-act="g-reject" data-id="' + E(g.id) + '">Reject</button>' : '') +
          '<button class="btn small danger" data-act="g-del" data-id="' + E(g.id) + '">Delete</button></div></div>'
        );
      })
      .join('');
    main.innerHTML =
      '<div class="page-head"><h1>Guest posts</h1></div>' +
      '<p class="help">You can edit the title and text before publishing. Approved posts appear in the Technology category with the guest name.</p>' +
      filterBar('guests', [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']]) +
      (res.error ? '<p class="empty">Could not load: ' + E(res.error.message) + '</p>' : rows || '<p class="empty">Nothing here.</p>');
  }

  async function approveGuest(id) {
    var box = $('g-' + id);
    var title = box.querySelector('.g-title').value.trim();
    var body = box.querySelector('.g-body').value;
    var name = box.querySelector('strong').textContent;
    if (!title) {
      toast('The title cannot be empty.', 'err');
      return;
    }
    var ins = await db.from('posts').insert({ category: 'tech', title: title, body: body, author_name: name, is_guest: true, published: true });
    if (ins.error) {
      toast('Could not publish: ' + ins.error.message, 'err');
      return;
    }
    var up = await db.from('guest_posts').update({ status: 'approved', title: title, body: body }).eq('id', id);
    if (up.error) toast('Published, but the status was not updated: ' + up.error.message, 'err');
    else toast('Guest post published.', 'ok');
    renderGuests();
    refreshBadges();
  }

  // Messages ---------------------------------------------------------------------------------------------

  async function renderMessages() {
    var main = $('main');
    main.innerHTML = '<div class="loading">Loading…</div>';
    var res = await db.from('messages').select('*').order('created_at', { ascending: false }).limit(200);
    if (state.tab !== 'messages') return;
    var rows = (res.data || [])
      .map(function (m) {
        var reply = mailOk(m.email) ? '<a class="btn small" href="mailto:' + E(m.email) + '?subject=' + encodeURIComponent('Re: your message') + '">Reply by email</a>' : '';
        return (
          '<div class="entry' + (m.is_read ? '' : ' unread') + '"><div class="entry-head"><span><strong>' + E(m.name) + '</strong> · ' + E(m.email) + '</span><span>' + when(m.created_at) + '</span></div>' +
          '<div class="entry-body">' + E(m.message) + '</div><div class="entry-actions">' + reply +
          '<button class="btn small" data-act="m-read" data-id="' + E(m.id) + '" data-r="' + (m.is_read ? '0' : '1') + '">' + (m.is_read ? 'Mark unread' : 'Mark read') + '</button>' +
          '<button class="btn small danger" data-act="m-del" data-id="' + E(m.id) + '">Delete</button></div></div>'
        );
      })
      .join('');
    main.innerHTML =
      '<div class="page-head"><h1>Messages</h1></div>' +
      '<p class="help">Messages sent through the contact form on your site.</p>' +
      (res.error ? '<p class="empty">Could not load: ' + E(res.error.message) + '</p>' : rows || '<p class="empty">No messages yet.</p>');
  }

  // Dashboard ------------------------------------------------------------------------------------------------

  function top(map, n) {
    return Object.keys(map)
      .map(function (k) {
        return [k, map[k]];
      })
      .sort(function (a, b) {
        return b[1] - a[1];
      })
      .slice(0, n);
  }

  function rowsHTML(pairs) {
    return pairs.length
      ? '<ul class="rows">' + pairs.map(function (p) { return '<li><span class="wrap">' + E(p[0]) + '</span><b>' + p[1] + '</b></li>'; }).join('') + '</ul>'
      : '<p class="hint">No data yet.</p>';
  }

  async function renderDashboard() {
    var main = $('main');
    if (!main.querySelector('.tiles')) main.innerHTML = '<div class="loading">Loading…</div>';
    var since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    var r = await Promise.all([
      db.from('visits').select('id', { count: 'exact', head: true }),
      db.from('visits').select('created_at,vid,path,referrer,device,lang,tz').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(5000)
    ]);
    if (state.tab !== 'dashboard') return;
    if (r[1].error) {
      main.innerHTML = '<div class="page-head"><h1>Dashboard</h1></div><p class="empty">Could not load visitor data: ' + E(r[1].error.message) + '</p>';
      return;
    }
    var rows = r[1].data || [];
    var days = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-CA'));
    }
    var views = {};
    var uniq = {};
    days.forEach(function (k) {
      views[k] = 0;
      uniq[k] = {};
    });
    var allUniq = {};
    var refs = {};
    var pages = {};
    var devs = {};
    rows.forEach(function (v) {
      var k = dayKey(v.created_at);
      if (views[k] === undefined) return;
      views[k]++;
      uniq[k][v.vid] = 1;
      allUniq[v.vid] = 1;
      var rf = v.referrer || 'Direct';
      refs[rf] = (refs[rf] || 0) + 1;
      pages[v.path] = (pages[v.path] || 0) + 1;
      devs[v.device || 'unknown'] = (devs[v.device || 'unknown'] || 0) + 1;
    });
    var tk = days[days.length - 1];
    var max = Math.max.apply(null, days.map(function (k) { return views[k]; }).concat([1]));
    var bars = days
      .map(function (k) {
        var u = Object.keys(uniq[k]).length;
        return (
          '<div class="bar-col" title="' + k + ': ' + views[k] + ' views, ' + u + ' visitors"><div class="bar-pair">' +
          '<div class="bar v" style="height:' + Math.round((views[k] / max) * 100) + '%"></div>' +
          '<div class="bar u" style="height:' + Math.round((u / max) * 100) + '%"></div></div>' +
          '<span class="bar-lbl">' + Number(k.slice(8)) + '</span></div>'
        );
      })
      .join('');
    var recent = rows.slice(0, 12)
      .map(function (v) {
        return '<li><span class="wrap"><b>' + E(v.path) + '</b> · ' + E(v.referrer || 'direct') + ' · ' + E(v.device) + '</span><span>' + when(v.created_at) + (v.tz ? ' · ' + E(v.tz) : '') + '</span></li>';
      })
      .join('');
    main.innerHTML =
      '<div class="page-head"><h1>Dashboard</h1></div>' +
      '<div class="tiles">' +
      '<div class="tile"><b>' + Object.keys(uniq[tk]).length + '</b><span>Visitors today</span></div>' +
      '<div class="tile"><b>' + views[tk] + '</b><span>Page views today</span></div>' +
      '<div class="tile"><b>' + Object.keys(allUniq).length + '</b><span>Visitors, last 14 days</span></div>' +
      '<div class="tile"><b>' + (r[0].count || 0) + '</b><span>Page views, all time</span></div></div>' +
      '<div class="card"><h3>Last 14 days</h3><div class="bars">' + bars + '</div>' +
      '<div class="legend"><i style="background:rgba(255,255,255,.18)"></i>Page views<i style="background:var(--cyan)"></i>Visitors</div></div>' +
      '<div class="two"><div class="card mini"><h3>Where visitors come from</h3>' + rowsHTML(top(refs, 5)) + '</div>' +
      '<div class="card mini"><h3>Pages</h3>' + rowsHTML(top(pages, 5)) + '</div></div>' +
      '<div class="two"><div class="card mini"><h3>Devices</h3>' + rowsHTML(top(devs, 3)) + '</div>' +
      '<div class="card mini"><h3>Latest visits</h3>' + (recent ? '<ul class="rows">' + recent + '</ul>' : '<p class="hint">No visits yet.</p>') + '</div></div>' +
      '<p class="hint">Only you can see these numbers. A visitor is one browser, not one person. Visits from browsers where you have signed in to this admin page are not counted. The timezone is a rough hint of the region.</p>';
  }

  // Backup -----------------------------------------------------------------------------------------------------

  async function renderBackup() {
    $('main').innerHTML =
      '<div class="page-head"><h1>Backup</h1></div>' +
      '<div class="card"><p class="help">Download all website sections and blog posts as one JSON file. Keep a copy somewhere safe now and then.</p>' +
      '<button class="btn primary" data-act="backup">Download backup</button></div>';
  }

  async function downloadBackup() {
    var posts = await db.from('posts').select('*').order('created_at', { ascending: false });
    var out = clone(state.content);
    out.posts = posts.data || [];
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site-backup-' + today() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
  }

  // Live notifications -----------------------------------------------------------------------------------------------

  var dashTimer = null;
  function subscribeLive() {
    function onChange(table, text) {
      return function (p) {
        var n = p.new || {};
        toast(typeof text === 'function' ? text(n) : text, 'info');
        refreshBadges();
        if (table === 'visits' && state.tab === 'dashboard') {
          clearTimeout(dashTimer);
          dashTimer = setTimeout(renderDashboard, 1500);
        }
        if (table === 'comments' && state.tab === 'comments') renderComments();
        if (table === 'guest_posts' && state.tab === 'guests') renderGuests();
        if (table === 'messages' && state.tab === 'messages') renderMessages();
      };
    }
    var ch = db.channel('admin-live');
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visits' }, onChange('visits', function (v) {
      return 'New visitor on ' + (v.path || '/') + (v.referrer ? ' from ' + v.referrer : '') + (v.tz ? ' (' + v.tz + ')' : '');
    }));
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, onChange('comments', 'A new comment is waiting for approval.'));
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guest_posts' }, onChange('guest_posts', 'A new guest post is waiting for approval.'));
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onChange('messages', 'You have a new message.'));
    ch.subscribe();
  }

  // Events ------------------------------------------------------------------------------------------------------------------

  async function simple(promise, okMsg, after) {
    var res = await promise;
    if (res.error) toast('Failed: ' + res.error.message, 'err');
    else if (okMsg) toast(okMsg, 'ok');
    if (after) after();
    refreshBadges();
  }

  function onClick(e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act;
    var id = el.dataset.id;
    switch (act) {
      case 'login': return login();
      case 'signout': return signOut();
      case 'go': return go(el.dataset.tab);
      case 'save': return saveSection(el.dataset.key);
      case 'soc-add':
        state.content.profile.socials.push({ type: 'facebook', url: '' });
        markDirty('profile');
        return renderSection('profile');
      case 'soc-del':
        state.content.profile.socials.splice(Number(el.dataset.si), 1);
        markDirty('profile');
        return renderSection('profile');
      case 'toggle':
      case 'add':
      case 'up':
      case 'down':
      case 'del':
        return sectionAction(act, el);
      case 'filter':
        state.filters[el.dataset.name] = el.dataset.f;
        return render();
      case 'post-new':
        state.editingPost = { id: null, title: '', category: 'tech', body: '', cover_url: '', published: true, show_in_news: false, date: today() };
        state.dirty.posts = true;
        return renderPostEditor();
      case 'post-edit':
        var p = (state.postRows || []).filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        state.editingPost = { id: p.id, title: p.title, category: p.category, body: p.body, cover_url: p.cover_url, published: p.published, show_in_news: !!p.show_in_news, date: dayKey(p.created_at) };
        state.dirty.posts = true;
        return renderPostEditor();
      case 'post-cancel':
        state.dirty.posts = false;
        state.editingPost = null;
        return renderPosts();
      case 'post-save': return savePost();
      case 'post-img':
        state.imgMode = el.dataset.mode;
        return $('pImgFile').click();
      case 'post-del':
        if (!confirm('Delete this post and its comments? This cannot be undone.')) return;
        return simple(db.from('posts').delete().eq('id', id), 'Post deleted.', renderPosts);
      case 'cmt-status':
        return simple(db.from('comments').update({ status: el.dataset.s }).eq('id', id), el.dataset.s === 'approved' ? 'Comment approved.' : 'Comment hidden.', renderComments);
      case 'cmt-del':
        if (!confirm('Delete this comment?')) return;
        return simple(db.from('comments').delete().eq('id', id), 'Comment deleted.', renderComments);
      case 'g-approve': return approveGuest(id);
      case 'g-reject':
        return simple(db.from('guest_posts').update({ status: 'rejected' }).eq('id', id), 'Rejected.', renderGuests);
      case 'g-del':
        if (!confirm('Delete this guest post?')) return;
        return simple(db.from('guest_posts').delete().eq('id', id), 'Deleted.', renderGuests);
      case 'm-read':
        return simple(db.from('messages').update({ is_read: el.dataset.r === '1' }).eq('id', id), null, renderMessages);
      case 'm-del':
        if (!confirm('Delete this message?')) return;
        return simple(db.from('messages').delete().eq('id', id), 'Message deleted.', renderMessages);
      case 'backup': return downloadBackup();
    }
  }

  function onInput(e) {
    var el = e.target;
    if (el.id === 'pTitle' || el.id === 'pBody' || el.id === 'pCover' || el.id === 'pNews') {
      state.dirty.posts = true;
      return;
    }
    if (el.dataset && el.dataset.soc && state.tab === 'profile') {
      state.content.profile.socials[Number(el.dataset.si)][el.dataset.soc] = el.value;
      markDirty('profile');
      return;
    }
    if (!el.dataset || !el.dataset.k) return;
    var key = state.tab;
    var cfg = SECTIONS[key];
    if (!cfg) return;
    var v = readVal(el);
    var target = el.dataset.i !== undefined ? state.content[key][Number(el.dataset.i)] : state.content[key];
    target[el.dataset.k] = v;
    if (el.dataset.k === 'show_in_news' && v && !target.news_date) {
      target.news_date = today();
      var box = el.closest('.grid');
      var di = box && box.querySelector('[data-k=news_date]');
      if (di) di.value = target.news_date;
    }
    markDirty(key);
  }

  function onChange(e) {
    if (e.target.id === 'pImgFile') {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      postImage(file);
    }
  }

  // Start ---------------------------------------------------------------------------------------------------------------------

  async function start() {
    if (!db) {
      app.innerHTML =
        '<div class="center-screen"><div class="login-card"><h1>Not connected yet</h1><p>Add your Supabase URL and anon key to assets/config.js (see SETUP.md), then reload this page.</p></div></div>';
      return;
    }
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    window.addEventListener('beforeunload', function (e) {
      if (anyDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    var r = await db.auth.getSession();
    if (location.search.indexOf('code=') > -1) history.replaceState(null, '', location.pathname);
    var session = r.data && r.data.session;
    if (!session) return renderLogin();

    var adm = await db.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
    if (adm.error) return renderLogin('Could not check admin access: ' + adm.error.message);
    if (!adm.data) return renderDenied(session);

    state.user = session.user;
    localStorage.setItem('no_track', '1');
    state.content = clone(await S.loadContent());
    var pr = state.content.profile || (state.content.profile = {});
    if (!Array.isArray(pr.socials)) {
      pr.socials = ['linkedin', 'scholar', 'github']
        .filter(function (t) { return pr[t]; })
        .map(function (t) { return { type: t, url: pr[t] }; });
    }
    if (pr.display_name === undefined) pr.display_name = String(pr.name || '').replace(/^md\.?\s+/i, '');
    if (pr.role_line === undefined) pr.role_line = 'AI & Machine Learning Engineer';
    if (pr.logo === undefined) pr.logo = '';
    state.snap = clone(state.content);
    renderShell();
    go('dashboard');
    refreshBadges();
    subscribeLive();
  }

  start();
})();
