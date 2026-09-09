(() => {
  const form = document.getElementById('reactForm');
  if (!form) return;

  const stickers = document.querySelectorAll('.react-sticker');
  const submitBtn = document.getElementById('reactSubmitBtn');

  function submitToNetlify(fields) {
    const body = new URLSearchParams({ 'form-name': 'portfolio-react', ...fields });
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  // Each sticker is now its own instant, standalone reaction — tapping
  // it sends immediately, no separate Send click required. The message
  // box below is a completely independent, optional second action.
  stickers.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-sent')) return; // already sent, don't double-submit

      const originalContent = btn.innerHTML;
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
        });
    });
  });

  // The message/about-you box is its own separate submission, works
  // whether or not someone also tapped a reaction sticker above.
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = document.getElementById('reactMessage').value.trim();
    const name = document.getElementById('reactName').value.trim();
    if (!message && !name) return; // nothing to send

    submitToNetlify({ reaction: '', message, name })
      .then(() => {
        submitBtn.textContent = 'Thank you so much!';
        submitBtn.disabled = true;
        submitBtn.classList.add('is-sent');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'contact_form_submit');
        }
      })
      .catch(() => {
        submitBtn.textContent = 'Something went wrong, try again';
      });
  });
})();
