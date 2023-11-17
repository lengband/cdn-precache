const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { request } = require('./request');
const { projectWhiteList, cdnBaseUrl } = require('./strategy');

const axiosInstance = axios.create();
class Precache {

  dataDir = 'data';

  projectContentwebMap = {
    'okfe/p2p': true, // https://static.coinall.ltd/cdn/assets/okfe/p2p/contentweb/9.2.304/asset-manifest.json
    'okfe/login': true,
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

    // 与本地文件对比，对比 files: string[] 字段
    const localManifest = JSON.parse(
      fs.readFileSync(`${this.dataDir}/${projectName}.json`, 'utf-8')
    );
    const diffFiles = manifestRes.files.filter(
      (file) => !localManifest.files.includes(file)
    );
    if (diffFiles.length) {
      console.log('diffFiles:', diffFiles);
      diffFiles.forEach((file) => {
        const assetUrl = this.getAssetUrl({ version, project: projectName, file, enableContentHashBuild: manifestRes.enableContentHashBuild });
        request.requestEntry(assetUrl, projectName, { showContent: true })
      });
    }
    // await fs.writeFileSync(`${this.dataDir}/${projectName}.json`, JSON.stringify(manifestRes, null, 2),'utf-8'); // DEBUG
  }

  getAssetUrl({ version, enableContentHashBuild, project, file }) {
    const isContentweb = this.projectContentwebMap[project];
    let versionPrefix = `/${version}`;
    // 兼容 ./index.js 情况
    let filename = file.startsWith('./') ? file.slice(2) : file;
    filename = filename.replace('/./', '/'); // 兼容：9.1.16/./index.media_lg_min-1024px.css
    if (enableContentHashBuild === true || enableContentHashBuild === 'true') {
      versionPrefix = '';
    }
    if (isContentweb) {
      versionPrefix = '/contentweb';
    }
    const assetUrl = `${cdnBaseUrl}/cdn/assets/okfe/${project}${versionPrefix}/${filename}`;
    return assetUrl
  }
}


const job = new Precache();
job.start();
