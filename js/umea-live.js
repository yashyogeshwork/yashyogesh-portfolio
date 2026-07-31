(() => {
  const el = document.getElementById('umeaLive');
  if (!el) return;

  function updateTime() {
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Stockholm',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    return time + ' local time';
  }

  let weatherText = '';
  function render() {
    el.textContent = updateTime() + (weatherText ? ' · ' + weatherText : '');
  }

  render();
  setInterval(render, 30000);

  // Open-Meteo — free, no API key required, CORS-friendly for
  // client-side use. Umeå coordinates.
  fetch('https://api.open-meteo.com/v1/forecast?latitude=63.8258&longitude=20.263&current=temperature_2m')
    .then((r) => r.json())
    .then((data) => {
      const temp = Math.round(data.current.temperature_2m);
      weatherText = temp + '°C';
      render();
    })
    .catch(() => {
      // Fail silently — the time still shows even if weather can't load
    });
})();
