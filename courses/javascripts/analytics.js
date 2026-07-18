/*
 * Cloudflare Web Analytics (free).
 * 1. https://dash.cloudflare.com → Web Analytics → Add site
 * 2. Replace YOUR_CLOUDFLARE_TOKEN below with the token from Cloudflare
 */
(function () {
  var token = "YOUR_CLOUDFLARE_TOKEN";
  if (!token || token === "YOUR_CLOUDFLARE_TOKEN") {
    return;
  }

  var script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.setAttribute("data-cf-beacon", JSON.stringify({ token: token }));
  document.head.appendChild(script);
})();
