(() => {
  const form = document.getElementById('reactForm');
  if (!form) return;

  const stickers = document.querySelectorAll('.react-sticker');
  const reactionInput = document.getElementById('reactionInput');
  const submitBtn = document.getElementById('reactSubmitBtn');

  stickers.forEach((btn) => {
    btn.addEventListener('click', () => {
      stickers.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      reactionInput.value = btn.dataset.value;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Require at least a reaction OR a message — an empty submit does
    // nothing rather than sending a blank entry.
    const message = document.getElementById('reactMessage').value.trim();
    if (!reactionInput.value && !message) return;

    const data = new FormData(form);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
    })
      .then(() => {
        // The button itself transforms — no separate message, no form
        // disappearing out from under the person.
        submitBtn.textContent = 'Thank you so much!';
        submitBtn.disabled = true;
        submitBtn.classList.add('is-sent');
      })
      .catch(() => {
        submitBtn.textContent = 'Something went wrong — try again';
      });
  });
})();
