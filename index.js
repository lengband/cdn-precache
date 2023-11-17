const fs = require('fs');
const path = require('path');
const axios = require('axios');
const request = require('./request');
const { projectWhiteList, cdnBaseUrl } = require('./strategy');

const axiosInstance = axios.create();
class Precache {

  dataDir = 'data';

  async run() {
    const { data: resData } = await axiosInstance.get(
      'https://api.smartproxy.cn/web_v1/ip/get-ip-v3?app_key=5d884abaf2ac978d71f6e2c9987e1508&pt=9&num=10&ep=&cc=SG&state=&city=&life=30&protocol=1&format=json&lb=%5Cr%5Cn'
    );
    const agentList = resData.data.list;
    const testUrl =
      'https://www.okx.com/cdn/assets/okfe/inner/assets-system-test/0.0.5/b.js';
    agentList.forEach((agentUrl, i) =>
      request(testUrl, agentUrl, { showContent: i === 0, showIp: true })
    );
  }

  async start() {
    try {
      const projectVersion = await axiosInstance.get(
        `${cdnBaseUrl}/cdn/assets/projectVerson.json`
      );
      const targetProjects = projectWhiteList.reduce((acc, cur) => {
        acc[cur] = projectVersion.data[cur];
        return acc;
      }, {});

      // 与本地文件对比
      const localProjectVersion = JSON.parse(
        fs.readFileSync(`${this.dataDir}/projectVersion.json`, 'utf-8')
      );
      const diffProjects = Object.keys(targetProjects).filter((project) => {
        return targetProjects[project] !== localProjectVersion[project];
      });

      diffProjects.forEach((project) =>
        this.diffProjectManifest(project, targetProjects[project])
      );

      // await fs.writeFileSync(`${this.dataDir}/projectVersion.json`, JSON.stringify(targetProjects, null, 2), 'utf-8'); // DEBUG
      // console.log('targetProjects:', targetProjects);
    } catch (error) {
      console.error('error:', error?.cause || error?.message);
    }
  }

  async diffProjectManifest(projectName, version) {
    const url = `${cdnBaseUrl}/cdn/assets/okfe/${projectName}/${version}/asset-manifest.json`;
    const { data: manifestRes } = await axiosInstance.get(url);
    await fs.writeFileSync(`${this.dataDir}/${projectName}.json`, JSON.stringify(manifestRes, null, 2),'utf-8');
    console.log({ manifestRes });
  }
}


const job = new Precache();
job.start();
