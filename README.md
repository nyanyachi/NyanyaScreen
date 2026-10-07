# NyanyaScreen

YouTube 영상을 화면 주변으로 확장해 몰입감 있는 시청 환경을 제공합니다. / Extend YouTube video into the surrounding screen for a more immersive viewing experience.

---

## 한국어

NyanyaScreen은 YouTube 영상을 시청할 때 영상 화면을 주변 영역으로 실시간 확장해
조금 더 몰입감 있는 시청 환경을 만들어주는 Chrome / Edge 확장 프로그램입니다.

### 주요 기능

- YouTube 몰입형 Custom Screen
- 현재 영상과 실시간으로 동기화되는 Video Spill
- Blur / Spread / Opacity 조절
- 설정값 로컬 저장
- 어두운 시청 환경
- 활성화 중 Scroll Lock
- 일반 모드 / 극장 모드 / 전체화면 지원
- YouTube 기본 플레이어와 컨트롤 유지

### 기본 설정

- Blur: 5px
- Spread: 240px
- Opacity: 75%

### 설치 방법

NyanyaScreen은 현재 GitHub를 통한 수동 설치 방식으로 배포됩니다.

1. Releases에서 최신 `NyanyaScreen-vX.X.X.zip` 파일을 다운로드합니다.
2. ZIP 파일의 압축을 풉니다.
3. 브라우저 확장 프로그램 페이지를 엽니다.
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
4. **개발자 모드(Developer mode)** 를 활성화합니다.
5. **압축해제된 확장 프로그램을 로드합니다(Load unpacked)** 를 선택합니다.
6. 압축을 푼 `NyanyaScreen` 폴더를 선택합니다.

ZIP 파일을 다운로드하는 것만으로 자동 설치되지는 않습니다.

### 사용 방법

1. YouTube 영상을 엽니다.
2. 브라우저 툴바에서 NyanyaScreen 아이콘을 클릭합니다.
3. NyanyaScreen을 **ON**으로 변경합니다.
4. Blur / Spread / Opacity 값을 원하는 대로 조절합니다.

페이지를 완전히 새로고침하면 NyanyaScreen은 다시 OFF 상태로 시작합니다.
Blur / Spread / Opacity 설정값은 브라우저에 저장되어 유지됩니다.

### 개인정보 보호

NyanyaScreen은 사용자 데이터를 외부 서버로 전송하지 않습니다.

Blur / Spread / Opacity 설정값만 브라우저의 `chrome.storage.local`에 로컬로 저장합니다.

### 지원 브라우저

- Google Chrome
- Microsoft Edge

### 버전

MVP v0.1.0

---

## English

NyanyaScreen is a lightweight Chrome and Edge Manifest V3 extension that creates a more immersive YouTube viewing experience by extending the current video into the surrounding screen area. It keeps YouTube’s native player and controls.

### Features

- Custom immersive YouTube viewing screen
- Real-time Video Spill synchronized with YouTube playback
- Adjustable Blur, Spread, and Opacity
- Dark viewing environment and scroll lock while active
- Supports Normal Mode, Theater Mode, and Fullscreen
- Keeps YouTube’s native player and controls
- No server, account, login, cloud sync, frameworks, or external dependencies

### Default Settings

- Blur: 5px
- Spread: 240px
- Opacity: 75%

### Installation

NyanyaScreen is currently distributed through manual installation from a GitHub Release ZIP:

1. Download the latest `NyanyaScreen-vX.X.X.zip` from Releases.
2. Extract the ZIP file.
3. Open the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted `NyanyaScreen` folder.

Downloading the ZIP does not install the extension automatically.

### Usage

1. Open a YouTube video.
2. Click the NyanyaScreen icon in the browser toolbar.
3. Turn NyanyaScreen **On**.
4. Adjust Blur, Spread, and Opacity as desired.

NyanyaScreen starts **Off** after a full page reload. Blur, Spread, and Opacity settings remain saved in the browser.

### Privacy

NyanyaScreen does not send user data to any external server. Blur, Spread, and Opacity preferences are stored locally in the browser using `chrome.storage.local`.

### Supported Browsers

- Google Chrome
- Microsoft Edge

### Version

MVP v0.1.0
