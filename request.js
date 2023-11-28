const request = require('request-promise');
const { countryWhiteList } = require('./strategy');


class Request {

  fetchState = {
    total: 0,
    success: 0,
    error: 0,
    successPercent: 0
  }

  getProxyUrl(num = 10, cc) {
    return `http://api.proxy.ipidea.io/getBalanceProxyIp?num=${num}&return_type=json&lb=1&sb=0&flow=1&regions=${cc}&protocol=socks5&spec=1`
  }

  async proxy(targetUrl, { cc, num })  {
    let agentList = [];
    try {
      const res = await request(this.getProxyUrl(num, cc));
      agentList = JSON.parse(res).data || [];
      console.log(`cc(${cc}) get proxy success: res(${res})`);
    } catch (error) {
      console.error(`cc(${cc})get proxy error:`, error?.cause || error?.message);
    }
    // targetUrl = 'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js';
    await Promise.all(agentList.map((agent, i) => this.singleFetch(targetUrl, `${agent.ip}:${agent.port}`, { showContent: i === -1, showIp: false })))
  }

  async requestEntry(taskList) {
    // taskList = taskList.slice(0, 2);
    this.taskList = taskList;
    return await Promise.all(taskList.map((task, i) => this.requestByCountry(task, i)));
  }

  async requestByCountry({ assetUrl }, i) {
    for (const key in countryWhiteList) {
      await this.proxy(assetUrl, {
        cc: key,
        num: countryWhiteList[key].number
        // num: 1
      })
      console.log(`
      requestByCountry: ${i}cc(${key}) / ${this.taskList.length} assetUrl(${assetUrl}) done
      fetchState(total[${this.fetchState.total}] success[${this.fetchState.success}] error[${this.fetchState.error}] successPercent[${this.fetchState.successPercent})
    `)
    }
    // console.log(`
    //   requestByCountry: ${i} / ${this.taskList.length} assetUrl(${assetUrl}) done
    //   fetchState(total[${this.fetchState.total}] success[${this.fetchState.success}] error[${this.fetchState.error}] successPercent[${this.fetchState.successPercent})
    // `)
  }

  async singleFetch(targetUrl, agentUrl, { showContent, showIp } = {}) {
    this.fetchState.total++;
    // const startTime = Date.now();
    const proxy = `socks5://${agentUrl}`;
    const promiseList = [request({ url: targetUrl, proxy, resolveWithFullResponse: true, timeout: 5000 })];
    if (showIp) {
      promiseList.push(request({ url: 'https://ipinfo.io', proxy }))
    }
    try {
      const [response, ipdata] = await Promise.all(promiseList)
      // console.log({
      //   targetUrl,
      //   proxy,
      //   CloudflareHit: response.headers['cf-cache-status'],
      //   cfRay: response.headers['cf-ray'],
      //   ipInfo: JSON.parse(typeof ipdata === 'object' ? ipdata : '{}'),
      //   time: Date.now() - startTime,
      // });
      this.fetchState.success++;
      this.fetchState.successPercent = this.fetchState.success / this.fetchState.total;
      if (showContent) {
        console.log(response.body, 'resssssssss');
      }
    } catch (error) {
      this.fetchState.error++;
      console.log("error:", error)
      // const msg = error?.cause || error?.message;
      // if (!msg.includes('timeout')) {
      //   console.error('get URL error:', );
      // }
    }
  }
}


module.exports = {
  request: new Request()
}