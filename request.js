const axios = require('axios');
const proxy = require('socks-proxy-agent');

const { SocksProxyAgent } = proxy;

const request = async (targetUrl, agentUrl, { showContent, showIp } = {}) => {
  const agent = new SocksProxyAgent('socks5://' + agentUrl);
  const instance = axios.create({
    httpAgent: agent,
    httpsAgent: agent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 agent/cdn-precache'
    }
  });

  const startTime = Date.now();
  const promiseList = [instance.get(targetUrl)];
  if (showIp) {
    promiseList.push(instance.get('http://143.92.61.72/utils/getRequestIpInfo'))
  }
  try {
    const [response, ipdata] = await Promise.all(promiseList)
    console.log({
      status: response.status,
      CloudflareHit: response.headers['cf-cache-status'],
      statusText: response.statusText,
      cfRay: response.headers['cf-ray'],
      ipInfo: ipdata?.data?.data,
      time: Date.now() - startTime,
    });
    if (showContent) {
      console.log(response.data, 'resssssssss');
    }
  } catch (error) {
    console.error('get URL error:', error?.cause || error?.message);
  }
}


module.exports = {
  request
}