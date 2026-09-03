// Real conversion tracking — GA4 was installed but only ever tracked
// automatic pageviews. The moments that actually matter for a
// portfolio (someone downloading the CV, clicking through to a real
// profile, or actually sending a message) were invisible until now.
// Fails silently and never blocks the link/form itself if gtag isn't
// available for any reason (an ad-blocker, gtag not yet loaded, etc.).
(() => {
  function track(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  const cvLink = document.querySelector('.about-cv');
  if (cvLink) {
    cvLink.addEventListener('click', () => {
      track('file_download', { file_name: 'yash-yogesh-cv.pdf', link_text: 'Download CV' });
    });
  }

  document.querySelectorAll('.about-email, .footer-link[href^="mailto:"]').forEach((el) => {
    el.addEventListener('click', () => track('email_click', { link_url: el.href }));
  });

  document.querySelectorAll('.footer-link[target="_blank"]').forEach((el) => {
    el.addEventListener('click', () => {
      const label = el.textContent.trim().toLowerCase(); // "linkedin", "instagram", "behance"
      track('social_click', { platform: label, link_url: el.href });
    });
  });
})();
