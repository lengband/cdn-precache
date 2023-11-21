const request = require('request-promise');

request
  .get(
    'http://api.proxy.ipidea.io/getBalanceProxyIp?num=10&return_type=json&lb=1&sb=0&flow=1&regions=sg&protocol=http'
  )
  .then((res) => {
    console.log(res.data, 'res.data');
    // res.data 是 类似下面的数据
    // 23.139.224.203:13692
    // 23.139.224.203:13693
    // 23.139.224.203:13694
    const agentList = res.data.data;

    request({
      url: 'https://ipinfo.io',
      proxy: `http://${agentList[0].ip}:${agentList[0].port}]}`,
    })
      .then(function(data){
        console.log(data);
      },
      function(err){ console.error(err)})
  });
