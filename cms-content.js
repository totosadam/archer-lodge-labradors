/* Archer Lodge Labradors — applies content/*.json over the static markup.
   Progressive enhancement: if a file is missing or malformed the page keeps
   whatever is hard-coded in the HTML, so nothing can go blank. */
(function () {
  var DEFAULT_PHONE = '(919) 899-8917';
  var DEFAULT_EMAIL = 'archerlodgelabpups@gmail.com';
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var digits = function (s) { return String(s || '').replace(/[^0-9]/g, ''); };

  function get(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; });
  }

  function waitFor(selector, cb) {
    var found = document.querySelector(selector);
    if (found) return cb(found);
    var tries = 0;
    var t = setInterval(function () {
      var el = document.querySelector(selector);
      if (el) { clearInterval(t); cb(el); }
      else if (++tries > 120) { clearInterval(t); }
    }, 50);
  }

  function puppyCard(p, phone) {
    var status = p.status || 'Available';
    var sold = /reserved|sold|pending/i.test(status);
    var badge = sold ? '#8d8274' : '#3f7a4a';
    var meta = [p.sex, p.color].filter(Boolean).join(' · ');
    return '' +
      '<div style="background:#fff;border:1px solid #ece4d8;border-radius:20px;overflow:hidden;box-shadow:0 16px 34px -26px rgba(68,53,40,.4)">' +
        '<div style="position:relative;aspect-ratio:1/1;background:#efe4d3">' +
          '<img src="' + esc(p.photo) + '" alt="' + esc(p.alt || (p.name + ', an English Labrador puppy')) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block">' +
          '<span style="position:absolute;top:14px;left:14px;background:' + badge + ';color:#fff;font-size:11px;font-weight:800;letter-spacing:.1em;padding:6px 12px;border-radius:999px">' + esc(status).toUpperCase() + '</span>' +
        '</div>' +
        '<div style="padding:22px 22px 26px">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:' + (p.litter ? '6px' : '12px') + '">' +
            '<h3 style="font-family:\'Playfair Display\',serif;font-weight:600;font-size:27px;color:#241f19;margin:0">' + esc(p.name) + '</h3>' +
            (meta ? '<span style="font-size:13px;font-weight:700;color:#a1917c">' + esc(meta) + '</span>' : '') +
          '</div>' +
          (p.litter ? '<div style="font-size:13px;color:#6b6155;margin:0 0 12px">' + esc(p.litter) + ' litter</div>' : '') +
          '<a href="tel:+1' + digits(phone) + '" style="font-size:14px;font-weight:800;color:#8a5a34;letter-spacing:.04em">Ask about ' + esc(p.name) + ' &rarr;</a>' +
        '</div>' +
      '</div>';
  }

  function litterCard(l) {
    return '' +
      '<div style="background:#fff;border:1px solid #ece4d8;border-radius:20px;padding:30px 28px">' +
        '<div style="font-size:12px;font-weight:800;letter-spacing:.16em;color:#8a5a34;margin-bottom:10px">' + esc(l.status || 'Open for reservations').toUpperCase() + '</div>' +
        '<h3 style="font-family:\'Playfair Display\',serif;font-weight:600;font-size:26px;color:#241f19;margin:0 0 8px">' + esc(l.name) + '</h3>' +
        '<p style="font-size:15px;color:#5b5348;margin:0 0 18px">' + esc(l.blurb) + '</p>' +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;border-top:1px solid #ece4d8;padding-top:16px">' +
          (l.price ? '<div><div style="font-size:11px;font-weight:800;letter-spacing:.13em;color:#a1917c">PRICE</div><div style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:600;color:#241f19;font-variant-numeric:tabular-nums">' + esc(l.price) + '</div></div>' : '') +
          (l.expected ? '<div><div style="font-size:11px;font-weight:800;letter-spacing:.13em;color:#a1917c">EXPECTED</div><div style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:600;color:#241f19">' + esc(l.expected) + '</div></div>' : '') +
        '</div>' +
      '</div>';
  }

  /* swap phone + email everywhere they appear, text and links alike */
  function applyContacts(phone, email) {
    if (phone && phone !== DEFAULT_PHONE) {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = walker.nextNode())) {
        if (n.nodeValue.indexOf(DEFAULT_PHONE) > -1) {
          n.nodeValue = n.nodeValue.split(DEFAULT_PHONE).join(phone);
        }
      }
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.setAttribute('href', 'tel:+1' + digits(phone));
      });
    }
    if (email && email !== DEFAULT_EMAIL) {
      var w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      var m;
      while ((m = w2.nextNode())) {
        if (m.nodeValue.indexOf(DEFAULT_EMAIL) > -1) {
          m.nodeValue = m.nodeValue.split(DEFAULT_EMAIL).join(email);
        }
      }
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        a.setAttribute('href', 'mailto:' + email);
      });
    }
  }

  Promise.all([
    get('content/site.json'),
    get('content/puppies.json'),
    get('content/litters.json')
  ]).then(function (res) {
    var s = res[0] || {}, pups = res[1], lits = res[2];
    var phone = s.phone || DEFAULT_PHONE;

    waitFor('body > x-dc, body', function () {
      setTimeout(function () {
        applyContacts(phone, s.email);

        var banner = document.querySelector('[data-cms="banner"]');
        if (banner && s.banner_bold) {
          banner.innerHTML = '<span><strong style="font-weight:700;color:#fff">' + esc(s.banner_bold) + '</strong>' + esc(s.banner_rest || '') + '</span>';
        }

        if (pups && pups.puppies && pups.puppies.length) {
          var grid = document.querySelector('[data-cms="puppy-grid"]');
          if (grid) {
            grid.innerHTML = pups.puppies.map(function (p) { return puppyCard(p, phone); }).join('');
          }
          var h = document.querySelector('[data-cms="puppy-heading"]');
          if (h && pups.heading) h.textContent = pups.heading;
          var i = document.querySelector('[data-cms="puppy-intro"]');
          if (i && pups.intro) i.textContent = pups.intro;
        }

        if (lits && lits.litters && lits.litters.length) {
          var lgrid = document.querySelector('[data-cms="litter-grid"]');
          if (lgrid) {
            lgrid.innerHTML = lits.litters.map(litterCard).join('');
          }
          var lh = document.querySelector('[data-cms="litter-heading"]');
          if (lh && lits.heading) lh.textContent = lits.heading;
          var li = document.querySelector('[data-cms="litter-intro"]');
          if (li && lits.intro) li.textContent = lits.intro;
        }
      }, 60);
    });
  });
})();
