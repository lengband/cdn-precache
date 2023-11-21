const request = require('request-promise');

request
  .get(
    'http://api.proxy.ipidea.io/getBalanceProxyIp?num=2&return_type=json&lb=1&sb=0&flow=1&regions=sg&protocol=http'
  )
  .then((res) => {
    const resData = JSON.parse(res).data;
    console.log({ resData });
    request({
      url: 'https://ipinfo.io',
      proxy: `http://${resData[0].ip}:${resData[0].port}}`,
    })
      .then(function(data){
        console.log('ipinfo:', data);
        request({
          url: 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js',
          proxy: `http://${resData[0].ip}:${resData[0].port}}`,
        }).then(console.log).catch(console.error)
      },
      function(err){ console.error(err)})
  });
