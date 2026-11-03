const https = require('https');

function fetchUrl(url, cb) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchUrl(res.headers.location, cb);
      return;
    }
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => cb(body));
  }).on('error', e => console.error(e));
}

fetchUrl('https://docs.google.com/spreadsheets/d/1XbtkFyAHhnl0j4jmW5nvnw5kLBAcdon6QwGlLUs40so/edit?usp=sharing', (html) => {
  const idx = html.indexOf('MARKETING ENGENHARQ');
  if (idx !== -1) {
    // Print 500 chars before and after
    console.log(html.substring(Math.max(0, idx - 400), idx + 200));
  }
});
