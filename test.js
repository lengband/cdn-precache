require('request-promise')({
  url: 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js',
  // url: 'https://ipinfo.io',
  proxy: 'http://okfe_cdn_precache-zone-custom-region-sg:Wp257207@proxy.ipidea.io:2336',
  })
.then(function(data){ console.log(data); },
  function(err){ console.error(err); });