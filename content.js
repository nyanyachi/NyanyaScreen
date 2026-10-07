const loggedVideos = new WeakSet();
let blur = 5;
let opacity = 75;
const settingKeys = {
  blur: "nyanyascreen.blur",
  spread: "nyanyascreen.spread",
  opacity: "nyanyascreen.opacity",
};

function validatedSetting(value, min, max, fallback) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;
}

const settingsReady = Promise.resolve().then(() =>
  chrome.storage.local.get(Object.values(settingKeys))
).then(saved => {
  blur = validatedSetting(saved[settingKeys.blur], 0, 60, 5);
  spread = validatedSetting(saved[settingKeys.spread], 0, 240, 240);
  opacity = validatedSetting(saved[settingKeys.opacity], 0, 100, 75);
  canvas.style.filter = `blur(${blur}px)`;
  canvas.style.opacity = String(opacity / 100);
}).catch(() => {});

function saveSetting(name, value) {
  try {
    Promise.resolve(chrome.storage.local.set({ [settingKeys[name]]: value })).catch(() => {});
  } catch {
    // A storage failure must not interrupt the live setting change.
  }
}

const canvas = document.createElement("canvas");
canvas.id = "nyanyascreen-spill";
canvas.setAttribute("aria-hidden", "true");
Object.assign(canvas.style, {
  position: "absolute",
  pointerEvents: "none",
  zIndex: "0",
  left: "0",
  top: "0",
  width: "100%",
  height: "100%",
  // Fill the display bounds independently of the source video's aspect ratio.
  objectFit: "cover",
  // Theater/fullscreen retain the original player-bound clip.
  clipPath: "inset(0)",
  // In-memory settings reset when the page reloads.
  filter: `blur(${blur}px)`,
  opacity: String(opacity / 100),
});

let currentVideo;
let enabled = false;
let spillHost;
let restoreHost;
let restoreTheaterOverflow;
let spillTheater = false;
let spread = 240;

const customScreenStyle = document.createElement("style");
customScreenStyle.id = "nyanyascreen-custom-screen-style";
customScreenStyle.textContent = `
  /* Lock the document, not the player or the extension popup. */
  html:has(ytd-watch-flexy.nyanyascreen-custom-screen),
  html:has(ytd-watch-flexy.nyanyascreen-custom-screen) body {
    overflow: hidden !important;
    overscroll-behavior: none !important;
    scroll-behavior: auto !important;
  }
  /* The header lives outside the watch page; scope these rules to its ON class. */
  ytd-app:has(ytd-watch-flexy.nyanyascreen-custom-screen) {
    --ytd-masthead-height: 0px !important;
    --ytd-toolbar-height: 0px !important;
  }
  /* The masthead can be nested under an app wrapper, not a direct app child. */
  ytd-app:has(ytd-watch-flexy.nyanyascreen-custom-screen) :is(#masthead-container, ytd-masthead) {
    display: none !important;
  }
  ytd-app:has(ytd-watch-flexy.nyanyascreen-custom-screen) ytd-page-manager {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }
  /* Darken the viewport canvas and its page layers, even below a short player. */
  html:has(ytd-watch-flexy.nyanyascreen-custom-screen),
  html:has(ytd-watch-flexy.nyanyascreen-custom-screen) body,
  ytd-app:has(ytd-watch-flexy.nyanyascreen-custom-screen),
  ytd-app:has(ytd-watch-flexy.nyanyascreen-custom-screen) ytd-page-manager,
  ytd-watch-flexy.nyanyascreen-custom-screen {
    background-color: #0b0b0b !important;
  }
  /* Hide structural content regions, including responsive feeds/chips below
     the player. Never hide the player, its contents, or an ancestor of it. */
  ytd-watch-flexy.nyanyascreen-custom-screen
    :is(#comments, #secondary, #secondary-inner, #below, #related, ytd-watch-metadata):not(#movie_player, #movie_player *):not(:has(#movie_player)) {
    display: none !important;
  }
  /* Reclaim the normal-mode sidebar column without sizing the video itself. */
  ytd-watch-flexy.nyanyascreen-custom-screen:not([theater]):not([fullscreen]) #columns {
    justify-content: center !important;
  }
  ytd-watch-flexy.nyanyascreen-custom-screen:not([theater]):not([fullscreen]) #primary {
    flex: 1 1 0 !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin-inline: 0 !important;
    padding-inline: 0 !important;
  }
  ytd-watch-flexy.nyanyascreen-custom-screen:not([theater]):not([fullscreen]) #player-container-outer {
    margin-inline: auto !important;
  }
`;
let customScreenHost;
let hadCustomScreenClass = false;
let previousPageScroll;

function updateCustomScreen(video) {
  const watch = video && video.closest("ytd-watch-flexy");
  if (watch === customScreenHost) return;
  // Capture before hiding content can shorten the page and clamp scrollY.
  if (watch && !previousPageScroll) {
    previousPageScroll = { left: window.scrollX, top: window.scrollY, url: location.href };
  }
  if (customScreenHost && !hadCustomScreenClass) {
    customScreenHost.classList.remove("nyanyascreen-custom-screen");
  }
  customScreenStyle.remove();
  customScreenHost = watch;
  if (!watch) {
    // Do not apply an old video's scroll position to a different SPA route.
    if (previousPageScroll?.url === location.href) {
      window.scrollTo({ left: previousPageScroll.left, top: previousPageScroll.top, behavior: "instant" });
    }
    previousPageScroll = undefined;
    return;
  }
  hadCustomScreenClass = watch.classList.contains("nyanyascreen-custom-screen");
  watch.classList.add("nyanyascreen-custom-screen");
  document.documentElement.append(customScreenStyle);
  // With the header removed, normal document flow places the player at the top.
  window.scrollTo({ left: 0, top: 0, behavior: "instant" });
}

function attachCanvas(video) {
  const player = video && video.closest("#movie_player");
  const watch = video && video.closest("ytd-watch-flexy");
  // Normal mode needs to escape player clipping; theater/fullscreen stay unchanged.
  const normal = watch && !watch.hasAttribute("theater") && !document.fullscreenElement;
  const theater = Boolean(watch && watch.hasAttribute("theater") && !document.fullscreenElement);
  const host = normal ? watch : player;
  if (host === spillHost && theater === spillTheater) return;
  if (spillHost) resizeObserver.unobserve(spillHost);
  canvas.remove();
  if (restoreHost) restoreHost();
  if (restoreTheaterOverflow) restoreTheaterOverflow();
  restoreTheaterOverflow = undefined;
  spillTheater = theater;
  spillHost = host;
  restoreHost = undefined;
  if (!host) return;
  canvas.style.zIndex = normal ? "-1" : "0";
  // Normal mode fades across the expanded margin on all four edges.
  // Intersect the two masks so corners fade in both directions too.
  canvas.style.clipPath = normal ? "none" : "inset(0)";
  canvas.style.maskComposite = normal ? "intersect" : "add";
  canvas.style.maskSize = "auto";
  canvas.style.maskRepeat = "repeat";
  canvas.style.maskClip = "border-box";
  if (theater) {
    // Fade actual canvas area below the player, not just out-of-box blur.
    canvas.style.clipPath = "inset(0)";
    canvas.style.maskSize = "100% 100%";
    canvas.style.maskRepeat = "no-repeat";
    canvas.style.maskClip = "border-box";

    // Player ancestors otherwise cut off the filtered canvas at the bottom.
    const previousOverflow = [];
    const overflowStyleAttributes = new Map();
    for (let element = player; element && element !== watch; element = element.parentElement) {
      const computed = getComputedStyle(element);
      if (![computed.overflowX, computed.overflowY].some(value => value === "hidden" || value === "clip")) continue;
      overflowStyleAttributes.set(element, element.hasAttribute("style"));
      for (const name of ["overflow-x", "overflow-y"]) {
        previousOverflow.push([element, name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
        element.style.setProperty(name, "visible", "important");
      }
    }
    restoreTheaterOverflow = () => {
      previousOverflow.forEach(([element, name, value, priority]) => {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      });
      overflowStyleAttributes.forEach((hadStyle, element) => {
        if (!hadStyle && element.style.length === 0) element.removeAttribute("style");
      });
    };
  }

  const properties = ["position", "isolation"];
  const hadHostStyle = host.hasAttribute("style");
  const previous = properties.map(name => [
    name, host.style.getPropertyValue(name), host.style.getPropertyPriority(name),
  ]);
  restoreHost = () => {
    previous.forEach(([name, value, priority]) => {
      if (value) host.style.setProperty(name, value, priority);
      else host.style.removeProperty(name);
    });
    if (!hadHostStyle && host.style.length === 0) host.removeAttribute("style");
  };
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  // Keep the canvas above its host background but behind the sharp player/UI.
  host.style.isolation = "isolate";
  host.prepend(canvas);
}

const canvasContext = canvas.getContext("2d");
const failedVideos = new WeakSet();
const redrawEvents = ["loadeddata", "seeked", "pause"];
let frameCallback;

function drawFrame() {
  const video = currentVideo;
  if (!enabled || !video || failedVideos.has(video) || video.readyState < 2 ||
      !canvas.width || !canvas.height) return;
  try {
    if (!canvasContext) throw new Error("Canvas 2D context is unavailable");
    canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
  } catch (error) {
    failedVideos.add(video);
    console.error("NyanyaScreen: Unable to draw YouTube video into canvas", error);
  }
}

function scheduleFrame() {
  if (!enabled || frameCallback !== undefined || !currentVideo || failedVideos.has(currentVideo)) return;
  frameCallback = typeof currentVideo.requestVideoFrameCallback === "function"
    ? currentVideo.requestVideoFrameCallback(onVideoFrame)
    : requestAnimationFrame(onVideoFrame);
}

function onVideoFrame() {
  frameCallback = undefined;
  drawFrame();
  scheduleFrame();
}

function sizeCanvas() {
  if (!enabled || !currentVideo) return;
  attachCanvas(currentVideo);
  if (!spillHost) return;
  const player = currentVideo.closest("#movie_player");
  resizeObserver.observe(player);
  resizeObserver.observe(spillHost);
  // Keep physical Spread unchanged; only shorten the bottom mask's fade tail.
  const bottomFade = Math.min(spread, 96);
  if (spillHost === player) {
    Object.assign(canvas.style, {
      left: "0", top: "0", width: "100%",
      height: spillTheater ? `calc(100% + ${spread}px)` : "100%",
      maskImage: spillTheater && spread > 0
        ? `linear-gradient(to bottom, black calc(100% - ${spread}px), transparent calc(100% - ${spread}px + ${bottomFade}px))`
        : "none",
    });
  } else {
    const bounds = player.getBoundingClientRect();
    const hostBounds = spillHost.getBoundingClientRect();
    // Symmetric expansion stays centered, with fading behind nearby page content.
    Object.assign(canvas.style, {
      left: `${bounds.left - spread - hostBounds.left + spillHost.scrollLeft - spillHost.clientLeft}px`,
      top: `${bounds.top - spread - hostBounds.top + spillHost.scrollTop - spillHost.clientTop}px`,
      width: `${bounds.width + spread * 2}px`,
      height: `${bounds.height + spread * 2}px`,
      clipPath: spread === 0 ? "inset(0)" : "none",
      maskImage: spread > 0 ? ["to right", "to bottom"].map(direction =>
        `linear-gradient(${direction}, transparent, black ${spread}px, black calc(100% - ${spread}px), transparent ${direction === "to bottom" ? `calc(100% - ${spread}px + ${bottomFade}px)` : "100%"})`
      ).join(", ") : "none",
    });
  }
  const width = currentVideo.offsetWidth;
  const height = currentVideo.offsetHeight;
  // Backing pixels follow the source; CSS display bounds follow the player.
  // Changing the backing size clears the canvas, so only update when needed.
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  drawFrame();
}

const resizeObserver = new ResizeObserver(sizeCanvas);
const positionObserver = new MutationObserver(sizeCanvas);
const modeObserver = new MutationObserver(sizeCanvas);

function findVideo() {
  const video = enabled && window.location.pathname === "/watch"
    ? document.querySelector("#movie_player video")
    : null;

  // The same ON/OFF and SPA lifecycle owns both Custom Screen and Spill.
  updateCustomScreen(video);

  if (video !== currentVideo) {
    if (currentVideo) {
      if (frameCallback !== undefined) {
        if (typeof currentVideo.requestVideoFrameCallback === "function") {
          currentVideo.cancelVideoFrameCallback(frameCallback);
        } else {
          cancelAnimationFrame(frameCallback);
        }
      }
      redrawEvents.forEach(event => currentVideo.removeEventListener(event, drawFrame));
    }
    frameCallback = undefined;
    resizeObserver.disconnect();
    positionObserver.disconnect();
    modeObserver.disconnect();
    currentVideo = video;
    if (video) {
      redrawEvents.forEach(event => video.addEventListener(event, drawFrame));
      resizeObserver.observe(video);
      positionObserver.observe(video, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
      const watch = video.closest("ytd-watch-flexy");
      if (watch) modeObserver.observe(watch, { attributes: true, attributeFilter: ["theater"] });
      scheduleFrame();
    }
  }

  attachCanvas(video);
  if (!video) return;
  if (spillHost) resizeObserver.observe(spillHost);
  sizeCanvas();

  if (loggedVideos.has(video)) return;
  loggedVideos.add(video);
  console.log("NyanyaScreen: YouTube video found", video);
}

const pageObserver = new MutationObserver(findVideo);

function setEnabled(nextEnabled) {
  if (enabled === nextEnabled) return;
  enabled = nextEnabled;
  if (enabled) {
    pageObserver.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("yt-navigate-finish", findVideo);
    document.addEventListener("fullscreenchange", findVideo);
    window.addEventListener("resize", sizeCanvas);
    document.addEventListener("scroll", sizeCanvas, true);
  } else {
    pageObserver.disconnect();
    document.removeEventListener("yt-navigate-finish", findVideo);
    document.removeEventListener("fullscreenchange", findVideo);
    window.removeEventListener("resize", sizeCanvas);
    document.removeEventListener("scroll", sizeCanvas, true);
  }
  // With enabled=false this cancels rendering, disconnects video observers,
  // removes video listeners/canvas, and restores host and ancestor styles.
  findVideo();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "nyanyascreen-get-state" &&
      message?.type !== "nyanyascreen-set-enabled" &&
      message?.type !== "nyanyascreen-set-blur" &&
      message?.type !== "nyanyascreen-set-spread" &&
      message?.type !== "nyanyascreen-set-opacity") return;

  settingsReady.then(() => {
  if (message?.type === "nyanyascreen-set-enabled" && typeof message.enabled === "boolean") {
    setEnabled(message.enabled);
  } else if (message?.type === "nyanyascreen-set-blur") {
    if (typeof message.blur === "number" && Number.isFinite(message.blur)) {
      blur = validatedSetting(message.blur, 0, 60, blur);
      canvas.style.filter = `blur(${blur}px)`;
      saveSetting("blur", blur);
    }
  } else if (message?.type === "nyanyascreen-set-spread") {
    if (typeof message.spread === "number" && Number.isFinite(message.spread)) {
      spread = validatedSetting(message.spread, 0, 240, spread);
      sizeCanvas();
      saveSetting("spread", spread);
    }
  } else if (message?.type === "nyanyascreen-set-opacity") {
    if (typeof message.opacity === "number" && Number.isFinite(message.opacity)) {
      opacity = validatedSetting(message.opacity, 0, 100, opacity);
      canvas.style.opacity = String(opacity / 100);
      saveSetting("opacity", opacity);
    }
  }
  sendResponse({ enabled, blur, spread, opacity });
  }).catch(() => sendResponse({ enabled, blur, spread, opacity }));
  return true;
});
