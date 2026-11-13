# facebook adblock

An enhanced, open-source Ad Blocker & Feed Cleaner for Facebook™ (Thai & English UI supported).

- Forked & upgraded from [facebook-adblock/facebook_adblock](https://github.com/facebook-adblock/facebook_adblock) (Original work by [tiratatp](https://github.com/tiratatp) & [Christos Botsikas](https://github.com/cbotsikas))
- **Real-time Blocked Counter:** Tracks blocked Reels, Suggested posts, and Sponsored ads with a quick reset option
- **Highlight Mode (ส่องแอด ไม่ซ่อน):** Highlights ads and unwanted posts instead of hiding them for easy inspection
- **Clean Mode (บล็อกทุกอย่าง):** One-click toggle to block all clutter across your feed
- **Granular Content Controls:**
  - Remove Reels
  - Remove Sponsored posts
  - Remove Suggested / Follow posts
  - Remove Marketplace & Right-hand side Ads
  - Remove Search Ads
  - Remove Stories
  - Remove "Groups you might like"
  - Remove "People You May Know" (PPYMK / คนอาจรู้จัก)
- **Page Whitelist:** Easily exempt specific pages from being blocked (comma-separated, e.g., `โหนกระแส, PageName`)
- **Privacy First:** Lightweight, does not slow down your browser, and does not track or read your Facebook activity

## Screenshot

<img width="372" height="584" alt="image" src="https://github.com/user-attachments/assets/1c802f88-936a-4b16-b31e-dba50e5ec4a8" />
<img width="870" height="290" alt="image" src="https://github.com/user-attachments/assets/95dd63e6-465f-4edb-94a3-ebe2ada8fac9" />
<img width="887" height="556" alt="image" src="https://github.com/user-attachments/assets/9a304374-4484-43da-87c9-503475d9b3d0" />
<img width="898" height="533" alt="image" src="https://github.com/user-attachments/assets/c119b4b8-11b9-4b7b-9b89-b34d08ee71b4" />


## Installation (Manual / Developer Mode)

Since this version is self-hosted and not distributed on the Chrome Web Store, you can install it manually in any Chromium-based browser (Chrome, Edge, Brave, etc.):

1. Download the latest release ZIP from this repository or clone it via Git (`git clone https://github.com/<YOUR_GITHUB_USERNAME>/facebook_adblock.git`). If you are building from source, run `npm install` and `npm run release` to generate the `dist/` folder.
2. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode** (โหมดนักพัฒนาซอฟต์แวร์) in the top-right corner.
4. Click **Load unpacked** (โหลดส่วนขยายที่แตกไฟล์แล้ว) and select the extracted extension folder (or the `dist/` folder).
5. Pin the extension to your toolbar and configure your blocking preferences.

## Building from Source

1. Install dependencies:
   ```bash
   npm install
Build the extension:

Bash
npm run release
The compiled extension will be generated in the dist/ directory.

Debugging
You can toggle Highlight mode directly from the extension popup to visually inspect detected elements on the page without hiding them.

Additionally, processed DOM elements are flagged with data-blocked attributes (allowedList, blockedList, sponsored), which can be inspected via Browser DevTools Console using selectors like *[data-blocked] or *[data-blocked=sponsored].

Support
If you find this updated extension useful, feel free to support the development via the Buy me a coffee button inside the extension popup!

We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Facebook.

Facebook is a registered trademark of Meta Platforms, Inc.
