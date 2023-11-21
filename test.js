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
      proxy: `http://${resData[0].ip}:${resData[0].port}]}`,
    })
      .then(function(data){
        console.log(data);
      },
      function(err){ console.error(err)})
  });
