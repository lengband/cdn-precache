const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { request } = require('./request');
const { projectWhiteList, cdnBaseUrl } = require('./strategy');

const axiosInstance = axios.create();
class Precache {

  dataDir = 'data';

  lock = false;

  projectContentwebMap = {
    'okfe/p2p': true, // https://static.coinall.ltd/cdn/assets/okfe/p2p/contentweb/9.2.304/asset-manifest.json
    'okfe/login': true,
  }

  async start() {
    if (this.lock) {
      return;
    }
    this.lock = true;
    try {
      const projectVersion = await axiosInstance.get(
        `${cdnBaseUrl}/projectVerson.json?v=${+new Date()}}`
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

      const allDiffFiles = diffProjects.reduce((preDiffFiles, project) => {
        const diffFiles = this.diffProjectManifest(project, targetProjects[project]);
        return preDiffFiles.concat(diffFiles);
      }, []);

      console.log('allDiffFiles:', allDiffFiles);

      const taskList = allDiffFiles.map((file) => {
        const assetUrl = this.getAssetUrl({ version, project: projectName, file, enableContentHashBuild: manifestRes.enableContentHashBuild });
        return { assetUrl }
      })

      await request.requestEntry(taskList)

      await fs.writeFileSync(`${this.dataDir}/projectVersion.json`, JSON.stringify(targetProjects, null, 2), 'utf-8'); // DEBUG
    } catch (error) {
      console.error('error:', error?.cause || error?.message);
    }
    this.lock = false;
  }

  async diffProjectManifest(projectName, version) {
    const url = `${cdnBaseUrl}/okfe/${projectName}/${version}/asset-manifest.json`;
    const { data: manifestRes } = await axiosInstance.get(url);
    // 与本地文件对比，对比 files: string[] 字段
    const localManifest = JSON.parse(
      fs.readFileSync(`${this.dataDir}/${projectName}.json`, 'utf-8')
    );
    const diffFiles = manifestRes.files.filter(
      (file) => !localManifest.files.includes(file)
    );
    await fs.writeFileSync(`${this.dataDir}/${projectName}.json`, JSON.stringify(manifestRes, null, 2),'utf-8'); // DEBUG
    return diffFiles;
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
    const assetUrl = `${cdnBaseUrl}/okfe/${project}${versionPrefix}/${filename}`;
    return assetUrl
  }
}


const job = new Precache();

setInterval(() => {
  job.start();
}, 10000)
