function getAppInfo_() {
  const cacheKey = "app_info:deploy";
  const cached = getCachedJson_(cacheKey);
  if (cached) return cached;

  const fallback = getAppInfoFallback_();
  const gasDeploy = getLatestGasWebDeployment_();
  const info = gasDeploy || fallback;

  return putCachedJson_(cacheKey, info, CONFIG.CACHE_TTL_APP_INFO);
}

function getAppInfoFallback_() {
  const release = CONFIG.RELEASE_FALLBACK || {};
  return {
    environment: CONFIG.ENVIRONMENT || "PRODUCCION",
    version: release.VERSION || "sin version",
    deployedAt: release.DEPLOYED_AT || "",
    deployedAtLabel: release.DEPLOYED_AT ? formatDeployDate_(release.DEPLOYED_AT) : "sin fecha de deploy",
    source: release.SOURCE || "config"
  };
}

function getLatestGasWebDeployment_() {
  try {
    const scriptId = ScriptApp.getScriptId();
    const webDeployments = fetchGasDeployments_(scriptId)
      .filter(isWebDeployment_)
      .sort(function(a, b) {
        return new Date(b.updateTime || 0).getTime() - new Date(a.updateTime || 0).getTime();
      });
    const versionedDeployments = webDeployments.filter(function(deployment) {
      const config = deployment.deploymentConfig || {};
      return !!config.versionNumber;
    });
    const deployments = versionedDeployments.length ? versionedDeployments : webDeployments;

    if (!deployments.length) return null;

    const latest = deployments[0];
    const config = latest.deploymentConfig || {};
    const version = config.versionNumber ? `v${config.versionNumber}` : "HEAD";

    return {
      environment: CONFIG.ENVIRONMENT || "PRODUCCION",
      version: version,
      deployedAt: latest.updateTime || "",
      deployedAtLabel: latest.updateTime ? formatDeployDate_(latest.updateTime) : "sin fecha de deploy",
      deploymentId: latest.deploymentId || "",
      description: config.description || "",
      source: "gas"
    };
  } catch (error) {
    return null;
  }
}

function fetchGasDeployments_(scriptId) {
  const url = `https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}/deployments?pageSize=50`;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`No se pudo leer deployments GAS (${response.getResponseCode()}).`);
  }

  const body = JSON.parse(response.getContentText() || "{}");
  return Array.isArray(body.deployments) ? body.deployments : [];
}

function isWebDeployment_(deployment) {
  return (deployment.entryPoints || []).some(function(entryPoint) {
    return entryPoint.entryPointType === "WEB_APP" || entryPoint.webApp;
  });
}

function formatDeployDate_(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value || "");
  return Utilities.formatDate(date, CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm");
}
