# NyanyaScreen

NyanyaScreen is a lightweight Chrome and Edge Manifest V3 extension that creates a more immersive YouTube viewing experience by extending the current video into the surrounding screen area. It keeps YouTube’s native player and controls.

## Features

- Custom immersive viewing screen with a dark background and scroll lock
- Real-time Video Spill synchronized with YouTube playback
- Adjustable Blur, Spread, and Opacity
- Supports Normal Mode, Theater Mode, and Fullscreen
- Uses YouTube’s native player and controls
- Saves visual settings locally in the browser
- No server, account, login, cloud sync, frameworks, or external dependencies

## Default Settings

- Blur: 5px
- Spread: 240px
- Opacity: 75%

## Installation

Install manually from a GitHub Release ZIP:

1. Download the latest release ZIP.
2. Extract the ZIP.
3. Open the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted NyanyaScreen folder.

This is manual distribution. Downloading or extracting the ZIP does not install the extension automatically.

## Usage

1. Open a YouTube video.
2. Click the NyanyaScreen extension icon.
3. Turn NyanyaScreen **On**.
4. Adjust Blur, Spread, and Opacity as desired.

NyanyaScreen starts **Off** after a full page reload. Your visual settings remain saved in the browser.

## Privacy

NyanyaScreen does not send user data to any external server. Blur, Spread, and Opacity preferences are stored locally in the browser using `chrome.storage.local`.

## Supported Browsers

- Google Chrome
- Microsoft Edge

## Version

MVP v0.1.0
