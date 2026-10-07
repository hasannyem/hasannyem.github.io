(function () {
  var S = window.Site;
  var E = S.esc;

  function $(id) {
    return document.getElementById(id);
  }
  function arr(v) {
    return Array.isArray(v) ? v : [];
  }
  function safeUrl(u) {
    return /^(https?:|mailto:)/i.test(u || '') ? u : '';
  }
  function ext(url) {
    return safeUrl(url);
  }

  var STATUS = {
    published: 'Published',
    accepted: 'Accepted',
    under_review: 'Under Review',
    submitted: 'Submitted',
    in_preparation: 'In Preparation'
  };

  var ICONS = {
    linkedin: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>',
    scholar: '<path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.128.96.341 1.902.62 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.28 1.849.493 2.81.62A2 2 0 0122 14.92z"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>'
  };
  var EDU_ICONS = {
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    book: '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
  };

  var SOCIALS = {
    linkedin: { label: 'LinkedIn', icon: ICONS.linkedin },
    scholar: { label: 'Google Scholar', icon: ICONS.scholar },
    github: { label: 'GitHub', icon: ICONS.github },
    researchgate: { label: 'ResearchGate', txt: 'RG' },
    orcid: { label: 'ORCID', txt: 'iD' },
    facebook: { label: 'Facebook', icon: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>' },
    instagram: { label: 'Instagram', icon: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>' },
    x: { label: 'X (Twitter)', icon: '<path d="M4 4l16 16M20 4L4 20"/>' },
    youtube: { label: 'YouTube', icon: '<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>' },
    telegram: { label: 'Telegram', icon: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
    whatsapp: { label: 'WhatsApp', icon: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>' },
    website: { label: 'Website', icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>' },
    other: { label: 'Link', icon: '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>' }
  };

  function socialList(p) {
    var list = Array.isArray(p.socials)
      ? p.socials
      : ['linkedin', 'scholar', 'github']
          .filter(function (t) {
            return p[t];
          })
          .map(function (t) {
            return { type: t, url: p[t] };
          });
    return list.filter(function (r) {
      return r && safeUrl(r.url);
    });
  }

  function svg(path) {
    return '<svg viewBox="0 0 24 24">' + path + '</svg>';
  }

  function lis(points) {
    return arr(points)
      .map(function (p) {
        return '<li>' + E(p) + '</li>';
      })
      .join('');
  }

  function renderHero(p) {
    p = p || {};
    var social = socialList(p)
      .map(function (r) {
        var d = SOCIALS[r.type] || SOCIALS.other;
        var inner = d.txt ? '<b>' + d.txt + '</b>' : svg(d.icon);
        return '<a href="' + E(r.url) + '" class="soc-btn" title="' + E(d.label) + '" aria-label="' + E(d.label) + '" target="_blank" rel="noopener">' + inner + '</a>';
      })
      .join('');
    if (p.email) social += '<a href="mailto:' + E(p.email) + '" class="soc-btn" title="Email" aria-label="Email">' + svg(ICONS.mail) + '</a>';

    var contact = '';
    if (p.email) contact += '<a href="mailto:' + E(p.email) + '">' + E(p.email) + '</a><br/>';
    if (p.phone) contact += E(p.phone) + '<br/>';
    if (p.address) contact += E(p.address);

    var bio = arr(p.bio)
      .map(function (t) {
        return '<p class="hero-bio">' + E(t) + '</p>';
      })
      .join('');
    var tags = arr(p.tags)
      .map(function (t) {
        return '<span class="htag">' + E(t) + '</span>';
      })
      .join('');

    var disp = p.display_name || String(p.name || '').replace(/^md\.?\s+/i, '');
    var words = String(disp).trim().split(/\s+/);
    var headHtml = '<span class="accent">' + E(words[0] || '') + '</span>' + (words.length > 1 ? ' ' + E(words.slice(1).join(' ')) : '');
    var city = String(p.location || '');

    $('heroMount').innerHTML =
      '<div class="hero-left fade-up">' +
      '<div class="photo-wrap"><div class="photo-shape"></div>' +
      '<div class="photo-frame"><img src="' + E(p.photo || 'ProfilePhoto.jpg') + '" alt="' + E(p.name) + '"/></div>' +
      (city ? '<div class="photo-badge">' + E(city) + '</div>' : '') + '</div>' +
      '<div class="info-card">' +
      '<div class="profile-title">' + E(p.title) + '</div>' +
      (p.badge ? '<div class="open-badge">' + E(p.badge) + '</div>' : '') +
      '<div class="profile-social">' + social + '</div>' +
      '<div class="profile-contact">' + contact + '</div>' +
      '</div></div>' +
      '<div class="hero-right fade-up">' +
      (p.eyebrow ? '<div class="hero-eyebrow">' + E(p.eyebrow) + '</div>' : '') +
      '<div class="hero-hi">Hi, I’m</div>' +
      '<h1 class="hero-name" aria-label="' + E(disp) + '">' + headHtml + '</h1>' +
      (p.role_line ? '<div class="hero-role">' + E(p.role_line) + '</div>' : '') +
      bio +
      '<div class="hero-tags">' + tags + '</div>' +
      '<div class="hero-btns">' +
      '<a href="#contact" class="btn btn-cyan">Get In Touch <span aria-hidden="true">→</span></a>' +
      (safeUrl(p.cv_url) ? '<a href="' + E(p.cv_url) + '" class="btn btn-ghost" target="_blank" rel="noopener">' + svg(ICONS.download) + 'Download CV</a>' : '') +
      '</div>' +
      '<div class="news-box" id="news" hidden><div class="news-head"><h2>News</h2><button type="button" class="news-more" id="newsMore" hidden></button></div><div class="news-list" id="newsMount"></div></div>' +
      '</div>';

    var nav = $('navName');
    var logo = String(p.logo || '').trim();
    if (logo && (/^https:\/\//i.test(logo) || /^[\w\-][\w\-./]*$/.test(logo)) && logo.indexOf('..') < 0) {
      nav.innerHTML = '<img class="nav-logo" src="' + E(logo) + '" alt="' + E(p.short_name || p.name || 'Home') + '"/>';
      nav.classList.add('has-logo');
    } else {
      nav.textContent = p.short_name || p.name || '';
      nav.classList.remove('has-logo');
    }
    $('footName').textContent = p.name || '';
    $('footNote').textContent = (p.footer_note ? p.footer_note + ' · ' : '') + new Date().getFullYear();
    if (p.name) document.title = p.name + ' — ' + (p.title || '');

    var info = '<p class="contact-intro">' + E(p.contact_intro) + '</p>';
    function item(icon, inner) {
      return '<div class="contact-item"><div class="c-icon">' + svg(icon) + '</div><div class="c-text">' + inner + '</div></div>';
    }
    if (p.email) info += item(ICONS.mail, '<a href="mailto:' + E(p.email) + '">' + E(p.email) + '</a>');
    if (p.phone) info += item(ICONS.phone, E(p.phone));
    if (p.address) info += item(ICONS.pin, E(p.address));
    socialList(p).forEach(function (r) {
      var d = SOCIALS[r.type] || SOCIALS.other;
      if (d.txt) return;
      info += item(d.icon, '<a href="' + E(r.url) + '" target="_blank" rel="noopener">' + E(d.label) + '</a>');
    });
    $('contactInfo').innerHTML = info;
  }

  var NEWS_SHOWN = 5;

  function newsItems(c, posts) {
    var out = [];
    arr(c.news).forEach(function (n) {
      out.push({ date: n.date, text: n.text, link: n.link, label: n.link_label || 'Read more', ext: true });
    });
    function from(list, tag, anchor, make) {
      arr(list).forEach(function (it) {
        if (!it || !it.show_in_news) return;
        out.push({ date: it.news_date, text: it.news_text || make(it), link: anchor, tag: tag });
      });
    }
    from(c.publications, 'Publication', '#publications', function (i) {
      return 'Paper (' + (STATUS[i.status] || 'Submitted') + '): ' + i.title;
    });
    from(c.research, 'Research', '#research', function (i) {
      return i.role + (i.topic ? ' — ' + i.topic : '');
    });
    from(c.experience, 'Experience', '#experience', function (i) {
      return i.role + (i.company ? ', ' + i.company : '');
    });
    from(c.education, 'Education', '#education', function (i) {
      return i.degree + (i.school ? ', ' + i.school : '');
    });
    from(c.training, 'Training', '#training', function (i) {
      return i.title + (i.org ? ', ' + i.org : '');
    });
    arr(posts).forEach(function (p) {
      if (!p.show_in_news) return;
      out.push({ date: p.created_at, text: p.title, link: 'blog.html?post=' + encodeURIComponent(p.id), tag: CAT[p.category] || 'Blog' });
    });
    out = out.filter(function (n) {
      return n.text;
    });
    out.forEach(function (n, i) {
      n.d = String(n.date || '').slice(0, 10);
      n.o = i;
    });
    out.sort(function (a, b) {
      return a.d === b.d ? a.o - b.o : a.d < b.d ? 1 : -1;
    });
    return out;
  }

  function renderNews(c, posts) {
    var items = newsItems(c, posts);
    var box = $('news');
    var links = document.querySelectorAll('[data-section="news"]');
    if (!items.length) {
      box.hidden = true;
      links.forEach(function (a) {
        a.hidden = true;
      });
      return;
    }
    box.hidden = false;
    links.forEach(function (a) {
      a.hidden = false;
    });
    var all = false;
    var more = $('newsMore');
    function draw() {
      $('newsMount').innerHTML = (all ? items : items.slice(0, NEWS_SHOWN))
        .map(function (n) {
          var text = E(n.text);
          if (n.ext) {
            if (ext(n.link)) text += '<a class="news-link" href="' + E(n.link) + '" target="_blank" rel="noopener">' + E(n.label) + '</a>';
          } else if (n.link) {
            text = '<a href="' + E(n.link) + '">' + text + '</a>';
          }
          return (
            '<div class="news-item"><div class="news-date">' + (n.d ? S.fmtDate(n.d) : '') + '</div>' +
            '<div class="news-text">' + text + '</div>' +
            (n.tag ? '<span class="news-tag">' + E(n.tag) + '</span>' : '') + '</div>'
          );
        })
        .join('');
      if (items.length > NEWS_SHOWN) {
        more.hidden = false;
        more.textContent = all ? 'Show less' : 'Show all (' + items.length + ')';
      }
    }
    more.addEventListener('click', function () {
      all = !all;
      draw();
    });
    draw();
  }

  function renderResearch(items) {
    $('researchMount').innerHTML = arr(items)
      .map(function (r) {
        var sup = r.supervisor_url && ext(r.supervisor_url)
          ? '<a href="' + E(r.supervisor_url) + '" target="_blank" rel="noopener">' + E(r.supervisor) + '</a>'
          : E(r.supervisor);
        var cert = ext(r.cert_url) ? '<a class="cert-link" href="' + E(r.cert_url) + '" target="_blank" rel="noopener">View Certificate ↗</a>' : '';
        return (
          '<div class="res-card fade-up"><div class="res-period">' + E(r.period) + '</div>' +
          '<div class="res-role">' + E(r.role) + '</div>' +
          '<div class="res-topic">' + E(r.topic) + '</div>' +
          '<div class="res-supervisor">' + sup + '</div>' +
          '<ul class="res-points">' + lis(r.points) + '</ul>' + cert + '</div>'
        );
      })
      .join('');
  }

  function renderInterests(items) {
    $('interestsMount').innerHTML = arr(items)
      .map(function (i) {
        return '<div class="int-card fade-up"><div class="int-icon">' + E(i.icon) + '</div><div class="int-name">' + E(i.name) + '</div></div>';
      })
      .join('');
  }

  function renderPubs(items) {
    $('pubsMount').innerHTML = arr(items)
      .map(function (p, i) {
        var tag = p.index_tag ? ' <span class="idx">' + E(p.index_tag) + '</span>' : '';
        var pub = p.publisher ? ' · Publisher: ' + E(p.publisher) : '';
        var venue = p.venue || tag || pub ? '<div class="pub-venue">' + E(p.venue) + tag + pub + '</div>' : '';
        var links = [];
        if (p.doi) {
          var doi = String(p.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
          links.push('<a href="https://doi.org/' + E(doi) + '" class="pub-doi" target="_blank" rel="noopener">DOI: ' + E(doi) + ' ↗</a>');
        }
        if (ext(p.journal_url)) {
          links.push('<a href="' + E(p.journal_url) + '" class="pub-doi" target="_blank" rel="noopener">Journal ↗</a>');
        }
        if (ext(p.proof_url)) {
          links.push('<a href="' + E(p.proof_url) + '" class="pub-doi" target="_blank" rel="noopener">Submission Proof ↗</a>');
        }
        var link = links.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px 16px;">' + links.join('') + '</div>' : '';
        var st = STATUS[p.status] ? p.status : 'submitted';
        return (
          '<div class="pub-card fade-up"><div class="pub-num">' + (i + 1) + '</div><div>' +
          '<div class="pub-title">' + E(p.title) + '</div>' +
          '<div class="pub-authors">' + E(p.authors) + '</div>' + venue + link +
          '</div><span class="pub-status s-' + st + '">' + STATUS[st] + '</span></div>'
        );
      })
      .join('');
  }

  function renderSkills(groups) {
    $('skillsMount').innerHTML = arr(groups)
      .map(function (g) {
        var pills = arr(g.items)
          .map(function (it) {
            var core = it.charAt(0) === '*';
            return '<span class="skill-pill' + (core ? ' core' : '') + '">' + E(core ? it.slice(1).trim() : it) + '</span>';
          })
          .join('');
        return '<div class="skill-group fade-up"><div class="skill-group-title">' + E(g.title) + '</div><div class="skill-pills">' + pills + '</div></div>';
      })
      .join('');
  }

  function renderExperience(items) {
    $('experienceMount').innerHTML = arr(items)
      .map(function (x, i) {
        var tags = arr(x.tags)
          .map(function (t) {
            return '<span class="tl-tag">' + E(t) + '</span>';
          })
          .join('');
        var card =
          '<div class="tl-card"><div class="tl-period">' + E(x.period) + '</div>' +
          '<div class="tl-role">' + E(x.role) + '</div>' +
          '<div class="tl-company">' + E(x.company) + '</div>' +
          '<ul class="tl-points">' + lis(x.points) + '</ul>' +
          (tags ? '<div class="tl-tags">' + tags + '</div>' : '') + '</div>';
        var dot = '<div class="tl-center" style="position:relative;"><div class="tl-dot"></div></div>';
        var gap = '<div class="tl-spacer"></div>';
        return '<div class="tl-item fade-up">' + (i % 2 === 0 ? card + dot + gap : gap + dot + card) + '</div>';
      })
      .join('');
  }

  function renderEducation(items) {
    $('educationMount').innerHTML = arr(items)
      .map(function (e) {
        return (
          '<div class="edu-card fade-up"><div class="edu-icon">' + svg(EDU_ICONS[e.icon] || EDU_ICONS.cap) + '</div><div>' +
          '<div class="edu-degree">' + E(e.degree) + '</div>' +
          '<div class="edu-school">' + E(e.school) + '</div>' +
          '<div class="edu-period">' + E(e.period) + '</div>' +
          (e.cgpa ? '<div class="edu-cgpa">' + E(e.cgpa) + '</div>' : '') +
          (e.thesis ? '<div class="edu-thesis">' + E(e.thesis) + '</div>' : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderTraining(items) {
    $('trainingMount').innerHTML = arr(items)
      .map(function (t) {
        var cert = ext(t.cert_url) ? '<a class="cert-link" href="' + E(t.cert_url) + '" target="_blank" rel="noopener">View Certificate ↗</a>' : '';
        return (
          '<div class="train-card fade-up"><div class="train-year">' + E(t.year) + '</div><div>' +
          '<div class="train-title">' + E(t.title) + '</div>' +
          '<div class="train-org">' + E(t.org) + '</div>' +
          '<div class="train-period">' + E(t.period) + '</div>' +
          '<ul class="train-points">' + lis(t.points) + '</ul>' + cert + '</div></div>'
        );
      })
      .join('');
  }

  var CAT = { tech: 'Technology', personal: 'Personal' };
  var COVER_ICON = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';

  function renderBlog(posts) {
    var mount = $('blogMount');
    var list = arr(posts).slice(0, 4);
    if (!list.length) {
      mount.innerHTML = '<p class="empty">No posts yet.</p>';
      return;
    }
    mount.innerHTML = list
      .map(function (p) {
        var top = p.cover_url && /^https:\/\//.test(p.cover_url) ? '<img src="' + E(p.cover_url) + '" alt="" loading="lazy"/>' : COVER_ICON;
        return (
          '<a class="blog-card fade-up" href="blog.html?post=' + encodeURIComponent(p.id) + '">' +
          '<div class="blog-top">' + top + '</div><div class="blog-body">' +
          '<div class="blog-tag">' + E(CAT[p.category] || p.category) + '</div>' +
          '<div class="blog-title">' + E(p.title) + '</div>' +
          '<div class="blog-text">' + E(S.excerpt(p.body, 150)) + '</div>' +
          '<div class="blog-meta">' + S.fmtDate(p.created_at) + '</div></div></a>'
        );
      })
      .join('');
  }

  function setupContactForm() {
    var form = $('contactForm');
    var status = $('cStatus');
    var btn = $('cSend');
    function say(msg, cls) {
      status.textContent = msg;
      status.className = 'form-status' + (cls ? ' ' + cls : '');
    }
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = $('cName').value.trim();
      var email = $('cEmail').value.trim();
      var message = $('cMsg').value.trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
        say('Please fill in your name, a valid email and a message.', 'err');
        return;
      }
      if ($('cWebsite').value) {
        say('Thank you, your message was sent.', 'ok');
        return;
      }
      if (!S.db) {
        window.location.href = 'mailto:' + (window.__contactEmail || '') + '?subject=' + encodeURIComponent('Message from ' + name) + '&body=' + encodeURIComponent(message + '\n\n' + name + ' (' + email + ')');
        return;
      }
      var last = Number(localStorage.getItem('lastMsgAt') || 0);
      if (Date.now() - last < 60000) {
        say('Please wait a minute before sending another message.', 'err');
        return;
      }
      btn.disabled = true;
      say('Sending…');
      var res = await S.db.from('messages').insert({ name: name, email: email, message: message });
      btn.disabled = false;
      if (res.error) {
        say('Could not send the message. Please email me directly instead.', 'err');
        return;
      }
      localStorage.setItem('lastMsgAt', String(Date.now()));
      form.reset();
      say('Thank you, your message was sent.', 'ok');
    });
  }

  function setupScrollSpy() {
    var links = document.querySelectorAll('.nav-links a');
    function update() {
      var cur = 'about';
      document.querySelectorAll('.hero[id], section[id]').forEach(function (s) {
        if (!s.hidden && window.scrollY >= s.offsetTop - 90) cur = s.id;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  async function init() {
    S.setupNav();
    S.trackVisit();
    setupContactForm();

    var results = await Promise.all([S.loadContent(), S.loadPosts()]);
    var c = results[0];
    var posts = results[1];

    window.__contactEmail = (c.profile && c.profile.email) || '';
    renderHero(c.profile);
    renderNews(c, posts);
    renderResearch(c.research);
    renderInterests(c.interests);
    renderPubs(c.publications);
    renderSkills(c.skills);
    renderExperience(c.experience);
    renderEducation(c.education);
    renderTraining(c.training);
    renderBlog(posts);

    S.observeFades();
    setupScrollSpy();
    if (location.hash) {
      var t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView();
    }
  }

  init();
})();
