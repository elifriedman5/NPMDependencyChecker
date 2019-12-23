const axios = require('axios');
const redisCache = {};


exports.fetchDependencies = async function(req, res) {
  var resObj = await fetchDependenciesRecursive(req.params.packagename, req.params.version || 'latest');
  res.json(resObj);
  res.end();
};

async function fetchDependenciesRecursive(packagename, version){
  let finalVersionStr = version == 'latest' ? version : version.match(/(?:\d+.\d+.\d+)/g)[0];
  var currLevelDeps = await fetchCurrDependencies(packagename, finalVersionStr);

  let currLevelArray = [];
  // map object to promises
  const promises = Object.keys(currLevelDeps).map(async (key)=>{
      let children = await fetchDependenciesRecursive(key, currLevelDeps[key]);
      currLevelArray.push(children);
    });
  // wait until all promises are resolved
  await Promise.all(promises);

  let currLevelObj = {
    packagename: packagename,
    version: version,
    dependencies: currLevelArray
  };
  return currLevelObj;
}

async function fetchCurrDependencies(packagename, version){
  var cachedResult = redisCache[packagename + '$' + version];
  if(cachedResult){
    return deserializeCachedList(cachedResult);
  }
  let deps = await fetchFromApi(packagename, version);
  redisCache[packagename + '$' + version] = Object.keys(deps).map((key)=>{
      return key + '$' + deps[key];
    });
  return deps;
}

function deserializeCachedList(cachedResult){
  let result = {};
  cachedResult.forEach((strItem)=>{
    var split = strItem.split('$')
    result[split[0]] = split[1];
  });
  return result;
}

async function fetchFromApi(packagename, version){
  var url = 'https://registry.npmjs.org/' + packagename + '/' + (version || 'latest');

  try {
    const response = await axios.get(url);
    console.log(response.data.dependencies || {});
    return response.data.dependencies || {};
  } catch (error) {
    console.error(error);
  }
  return {};
}