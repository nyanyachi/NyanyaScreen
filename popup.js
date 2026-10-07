const toggle = document.getElementById("enabled");
const status = document.getElementById("status");
const logo = document.getElementById("logo");
const blurSlider = document.getElementById("blur");
const blurValue = document.getElementById("blur-value");
let blurRequest = 0;
const spreadSlider = document.getElementById("spread");
const spreadValue = document.getElementById("spread-value");
let spreadRequest = 0;
const opacitySlider = document.getElementById("opacity");
const opacityValue = document.getElementById("opacity-value");
let opacityRequest = 0;
let tabId;

function showState(response) {
  if (typeof response?.enabled !== "boolean") throw new Error("Unavailable content script");
  if (!Number.isFinite(response.blur)) throw new Error("Unavailable blur setting");
  if (!Number.isFinite(response.spread)) throw new Error("Unavailable spread setting");
  if (!Number.isFinite(response.opacity)) throw new Error("Unavailable opacity setting");
  toggle.checked = response.enabled;
  logo.src = response.enabled ? "Asset/Logo-On.png" : "Asset/Logo-Off.png";
  toggle.disabled = false;
  status.textContent = response.enabled ? "On" : "Off";
  blurSlider.value = response.blur;
  blurValue.textContent = `${response.blur} px`;
  blurSlider.disabled = false;
  spreadSlider.value = response.spread;
  spreadValue.textContent = `${response.spread} px`;
  spreadSlider.disabled = false;
  opacitySlider.value = response.opacity;
  opacityValue.textContent = `${response.opacity}%`;
  opacitySlider.disabled = false;
}

function showUnavailable() {
  toggle.checked = false;
  logo.src = "Asset/Logo-Off.png";
  toggle.disabled = true;
  blurSlider.disabled = true;
  spreadSlider.disabled = true;
  opacitySlider.disabled = true;
  status.textContent = "Unavailable on this page";
}

async function loadState() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) throw new Error("No active tab");
    tabId = tab.id;
    showState(await chrome.tabs.sendMessage(tabId, { type: "nyanyascreen-get-state" }));
  } catch {
    showUnavailable();
  }
}

toggle.addEventListener("change", async () => {
  logo.src = toggle.checked ? "Asset/Logo-On.png" : "Asset/Logo-Off.png";
  toggle.disabled = true;
  blurSlider.disabled = true;
  spreadSlider.disabled = true;
  opacitySlider.disabled = true;
  try {
    showState(await chrome.tabs.sendMessage(tabId, {
      type: "nyanyascreen-set-enabled",
      enabled: toggle.checked,
    }));
  } catch {
    showUnavailable();
  }
});

blurSlider.addEventListener("input", async () => {
  const value = Number(blurSlider.value);
  const request = ++blurRequest;
  blurValue.textContent = `${value} px`;
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "nyanyascreen-set-blur",
      blur: value,
    });
    // Older replies must not pull the slider back during a rapid drag.
    if (request !== blurRequest) return;
    if (!Number.isFinite(response?.blur)) throw new Error("Unavailable blur setting");
    blurSlider.value = response.blur;
    blurValue.textContent = `${response.blur} px`;
  } catch {
    if (request === blurRequest) showUnavailable();
  }
});

spreadSlider.addEventListener("input", async () => {
  const value = Number(spreadSlider.value);
  const request = ++spreadRequest;
  spreadValue.textContent = `${value} px`;
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "nyanyascreen-set-spread",
      spread: value,
    });
    if (request !== spreadRequest) return;
    if (!Number.isFinite(response?.spread)) throw new Error("Unavailable spread setting");
    spreadSlider.value = response.spread;
    spreadValue.textContent = `${response.spread} px`;
  } catch {
    if (request === spreadRequest) showUnavailable();
  }
});

opacitySlider.addEventListener("input", async () => {
  const value = Number(opacitySlider.value);
  const request = ++opacityRequest;
  opacityValue.textContent = `${value}%`;
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "nyanyascreen-set-opacity",
      opacity: value,
    });
    if (request !== opacityRequest) return;
    if (!Number.isFinite(response?.opacity)) throw new Error("Unavailable opacity setting");
    opacitySlider.value = response.opacity;
    opacityValue.textContent = `${response.opacity}%`;
  } catch {
    if (request === opacityRequest) showUnavailable();
  }
});

loadState();
