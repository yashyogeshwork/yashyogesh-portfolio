(() => {
  const form = document.getElementById('reactForm');
  if (!form) return;

  const stickers = document.querySelectorAll('.react-sticker');
  const submitBtn = document.getElementById('reactSubmitBtn');

  // fetch() only rejects on a network failure: a 404 or 500 reply from the
  // server still resolves. Treating any resolved fetch as "sent" showed
  // "Got it, thanks" (and fired the analytics event) for messages that were
  // never received. Anything that isn't a 2xx reply is now a failure.
  function submitToNetlify(fields) {
    const body = new URLSearchParams({ 'form-name': 'portfolio-react', ...fields });
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r;
    });
  }

  // Each sticker is its own instant, standalone reaction: tapping it sends
  // immediately, no separate Send click required. The message box below is
  // a completely independent, optional second action.
  stickers.forEach((btn) => {
    let sending = false;
    // Saved once, up front. Saving it at click time meant a second click
    // during the "Try again" message captured *that* as the label to
    // restore, leaving the sticker stuck on "Try again" for good.
    const originalContent = btn.innerHTML;
    btn.addEventListener('click', () => {
      // Already sent, or a send is still in flight: never double-submit.
      if (btn.classList.contains('is-sent') || sending) return;
      sending = true;
      btn.setAttribute('aria-busy', 'true');

      submitToNetlify({ reaction: btn.dataset.value, message: '', name: '' })
        .then(() => {
          btn.classList.add('is-sent');
          btn.innerHTML = '<span>Got it, thanks</span>';
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'reaction_submit', { reaction_value: btn.dataset.value });
          }
        })
        .catch(() => {
          btn.innerHTML = '<span>Try again</span>';
          setTimeout(() => { btn.innerHTML = originalContent; }, 1500);
        })
        .finally(() => {
          sending = false;
          btn.removeAttribute('aria-busy');
        });
    });
  });

  // The message / about-you box is its own separate submission, and works
  // whether or not someone also tapped a reaction sticker above.
  const idleLabel = submitBtn.textContent;
  let sendingForm = false;
  let labelTimer = null;
  function flash(text, ms) {
    clearTimeout(labelTimer);
    submitBtn.textContent = text;
    labelTimer = setTimeout(() => { submitBtn.textContent = idleLabel; }, ms);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sendingForm || submitBtn.disabled) return; // a send is in flight, or already sent

    const message = document.getElementById('reactMessage').value.trim();
    const name = document.getElementById('reactName').value.trim();
    if (!message && !name) { flash('Write a message or your name first', 2500); return; }

    sendingForm = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitToNetlify({ reaction: '', message, name })
      .then(() => {
        clearTimeout(labelTimer);
        submitBtn.textContent = 'Thank you so much!';
        submitBtn.disabled = true;
        submitBtn.classList.add('is-sent');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'contact_form_submit');
        }
      })
      .catch(() => {
        // The error shows briefly, then the button is usable again.
        flash('Something went wrong, try again', 3000);
      })
      .finally(() => {
        sendingForm = false;
        submitBtn.removeAttribute('aria-busy');
      });
  });
})();
