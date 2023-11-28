const countryWhiteList = {
  nl: {
    number: 20
  },
  ng: {
    number: 10
  },
  ma: {
    number: 10
  },
  ar: {
    number: 10
  },
  br: {
    number: 10
  },
  mx: {
    number: 20
  },
  ro: {
    number: 10
  },
  it: {
    number: 10
  },
  ru: {
    number: 10
  },
  fr: {
    number: 10
  },
  iq: {
    number: 20
  },
}

const projectWhiteList = [
  'comb-trade',
  'growth'
]

const cdnBaseUrl = 'https://static.okx.com/cdn/assets'
const hkCdnBaseUrl = 'https://static.okx.com/cdn/assets'

module.exports = {
  countryWhiteList,
  projectWhiteList,
  cdnBaseUrl,
  hkCdnBaseUrl
}