const request = require('request-promise');

request
  .get(
    'http://api.proxy.ipidea.io/getBalanceProxyIp?num=10&return_type=json&lb=1&sb=0&flow=1&regions=sg&protocol=socks5'
  )
  .then((res) => {
    const resData = JSON.parse(res).data;
    console.log({ resData });
    resData.map((item) => {
      console.log(`proxy: http://${item.ip}:${item.port}}`);

      request({
        url: 'https://ipinfo.io',
        proxy: `socks5://${item.ip}:${item.port}}`,
        resolveWithFullResponse: true
      })
        .then(function(data){
          console.log('ipinfo:', data);
          request({
            url: 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js',
            proxy: `http://${item.ip}:${item.port}}`,
          }).then((body) => {
            console.log('body:', body)
          }).catch(console.error)
        },
        function(err){ console.error(err)})
    })
  });
