# AFTERPLAY

A browser console in deep black, white and electric red. Original branding with photographic cover art, inspired by console libraries rather than a copy of Steam's assets. Working name: domain/trademark availability has not been checked.

## Start here

Serve this folder with a static web server, or upload its contents to GitHub Pages / Cloudflare Pages. Opening `index.html` directly previews the shelf, but game launching now requires HTTP(S) because the runner fetches the HTML to install its overlay shortcut. There is no install, package manager, build step or framework. All game and artwork paths are relative, so GitHub project URLs work.

The four included games are playable original starter games, not third-party commercial games. Two are free; two demonstrate Pro access. Click a cover to select it, then Play. Double-clicking a cover launches it. Favorites, last played and unlocks are saved in this browser. Keyboard, touch and standard controller input are implemented; controller availability depends on browser/device and has not been hardware-tested.

## Add or change a game

1. Put the game's HTML and supporting files in `games/my-game/`. Keep its relative asset paths intact.
2. Put its artwork in `assets/my-game/`.
3. Duplicate a game object in `catalog.js` and update its fields:

```js
{
  id: 'my-game', // unique, stable ID
  title: 'MY GAME',
  subtitle: 'A short tagline.',
  genre: 'ADVENTURE / PUZZLE',
  description: 'A short description of your game.',
  entry: 'games/my-game/index.html',
  pro: false, // true = Pro/rewarded-unlock game
  controls: 'Arrow keys to move. Space to jump.',
  art: {
    icon: 'assets/my-game/icon.png',       // square, 128×128
    cover: 'assets/my-game/cover.webp',   // portrait, 600×800 recommended
    hero: 'assets/my-game/hero.webp',     // landscape, 1920×1080
    wide: 'assets/my-game/wide.webp'      // landscape, 960×540
  },
  color: '#ff3448'
}
```

Keep commas between objects. No editing the layout or game runner is needed. The bundled photographic artwork is reused across each game's image slots; replace each slot independently. Text titles are rendered over covers; choose art without baked-in titles.

Games run in a sandboxed iframe with scripts and pointer lock, without access to the launcher's local storage or top-level navigation. Games requiring local storage, service workers, fetch to protected origins, or same-origin APIs may need adaptation or a separate trusted game-hosting origin. Do not casually add `allow-same-origin` to same-origin untrusted games. The runner fetches same-origin HTML, preserves relative assets with a base URL, and injects game-bridge.js before game scripts. Escape / Shift + Tab opens the console overlay even when the game frame has keyboard focus. Games must be hosted with the launcher; external game URLs are rejected with an explanatory loading error.

## GitHub Pages: static prototype

1. Create a repository on GitHub.
2. Upload the **contents** of this folder, with `index.html` at the repository root. Include `.nojekyll` if using Git; the site also works without it.
3. Open **Settings → Pages → Build and deployment**.
4. Select **Deploy from a branch**, choose `main`, choose `/ (root)`, then Save.
5. Wait for the deployment; GitHub supplies the site URL.
6. For your own domain, enter it in **Settings → Pages → Custom domain**, configure the DNS records using GitHub's guide, verify ownership and enable HTTPS when available. A subdomain typically uses CNAME to `YOUR-USERNAME.github.io`, never the repository path.

GitHub Pages is technically compatible with this source. It is not intended/allowed for running an online business, ecommerce, or a commercial SaaS service. Use it for the prototype; choose appropriate commercial hosting before launching paid access. A custom domain does not change the hosting rules.

https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Recommended monetized hosting: Cloudflare Pages

The static launcher fits Cloudflare Pages' free tier, subject to its limits. Domain registration itself is separate and normally paid.

1. Keep the files in a GitHub repository.
2. In Cloudflare, create a **Pages** project and connect that repository.
3. Select no framework; build command `exit 0`; output directory `.` (the repository root).
4. Deploy. You receive a `pages.dev` URL. Future pushes update the site.
5. In the Pages project, choose **Custom domains → Set up a domain**.
6. For an apex domain, add it to Cloudflare and use Cloudflare nameservers. For a subdomain, follow the provided CNAME instructions. Add the domain in the Pages dashboard before creating DNS records.

Alternatively use Pages Direct Upload with this site's folder/ZIP. A Git-connected project is preferable for future edits. The free tier has per-file limits (currently 25 MiB); large game assets may need separate object storage.

https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
https://developers.cloudflare.com/pages/configuration/custom-domains/
https://developers.cloudflare.com/pages/platform/limits/

## Pro and rewarded ads

The Pro plan displays **$4.99 USD, one-time — Coming soon**. No payments are collected and no permanent paid entitlement is implemented.

`catalog.js` defaults to `ads: {mode:'demo', adUnit:''}`. Selecting a locked game offers **Try demo unlock** with an explicit notice that no advertisement is shown. After a short test delay it unlocks that game for 30 minutes on this browser. Set `mode:'off'` before publishing if you do not want demo unlocks available.

`ads.js` includes a Google Publisher Tag rewarded-web adapter. To use real ads:

1. Obtain an eligible, approved Google Ad Manager account and rewarded-web ad unit.
2. Complete the provider's site/domain, privacy, consent and inventory requirements. Configure a suitable consent platform before loading advertising scripts where required.
3. Set `ads.mode` to `google` and `ads.adUnit` to your real rewarded ad-unit path. Never use a sample inventory ID for production.
4. Test on supported devices. Ads may not fill every request, and ad blockers may prevent loading.

The adapter waits for the provider's `rewardedSlotGranted` event, then waits for close before launching. Early close, timeout, no-fill, unsupported device and loading failure do not grant a reward. Ordinary display ads are not a replacement for rewarded inventory; never ask users to click ads to unlock games. The real adapter has not been tested against live inventory because no publisher credentials or unit were supplied.

https://developers.google.com/publisher-tag/samples/display-rewarded-ad

## File protection and future payments

**HTML games cannot be made playable in a browser and impossible to copy.** The browser receives the HTML, JavaScript and assets. Encryption with a key shipped to the browser only obscures them; the decrypted content can still be captured. This project does not claim fake DRM or disable browser controls.

The current client-side Pro gate is a demonstration/access convenience, not secure authorization. Visitors can modify local storage or request game URLs directly. It is unsuitable for enforcing paid access.

Before enabling payments, add a backend with authentication, a verified payment webhook, durable entitlements, and authorized delivery of private game files (for example Workers + a database and private object storage). Verify any rewarded entitlements server-side through a provider-supported mechanism if the gate has real monetary value. Even authenticated delivery cannot prevent a legitimate player from extracting received code. Do not put payment secrets or private keys in this repository.

## Files

| File | Purpose |
|---|---|
| `catalog.js` | Game catalog, artwork paths, Pro flags and ad settings |
| `app.js` | Navigation, favorites, dialogs, input and iframe player |
| `ads.js` | Demo and real rewarded-ad adapters |
| `styles.css` | Responsive console styling |
| `games/` | Four playable starter games and shared engine |
| `assets/` | Local photographic artwork and original SVG brand mark |

No deployment, DNS changes or ad account setup has been performed automatically. Google Fonts is the only third-party request in demo mode; local fallback fonts keep the interface usable offline. Self-host the fonts or remove the CSS import if desired.

## Console shelf update

The homepage is a single fullscreen console scene, without a header, navigation bar, marketing sections or footer. Portrait tiles have a 2:3 ratio. Every non-selected tile rotates toward the selected cover; the selected tile faces forward and scales up. The shelf pans to keep the selected game in view. Arrow keys, mouse wheel, touch swipes and controller navigation move the selection. Use the logo, Console button, Escape or controller Menu to open the blurred system drawer. LB/RB switches between all games and favorites.

Use the console menu Fullscreen option to hide browser chrome (browsers require a user gesture). There is no forced fullscreen prompt.

## Artwork credits

Locally bundled Unsplash images are thematic cover art, not gameplay screenshots. The games themselves remain the four original starter games.

- Midnight Run: Shubhankar Sharma — https://unsplash.com/photos/_R5q6XWa0y0
- Orbit Breaker: https://images.unsplash.com/photo-1590336751349-f65720fee481
- Signal / Lost: Bradley Pelish — https://unsplash.com/photos/NPivaRqGFWw
- Ember: Eden Constantino — https://unsplash.com/photos/57nMMJhh3ig

The AFTERPLAY logo is retained unchanged.

## Artwork-first animation update

Larger portrait covers fill the homepage, with only the selected title above them. The existing 3D inward-facing selection effect remains; new title, menu, console-entry and game-loading animations respect reduced-motion settings.

| Shortcut | Action |
|---|---|
| Left / Right | Select game |
| Enter | Launch selected game |
| S | Save/remove favorite (not a gameplay save-state) |
| I | Details |
| F | Fullscreen |
| Escape on shelf | Console menu |
| Escape or Shift + Tab in game | Open/close game overlay |
| Controller Menu | Open/close game overlay |

Game overlay: Resume, Restart, Fullscreen and Exit to shelf. A small Menu button is available for touch-only devices. No launcher toolbar remains above the game. Bundled games honor pause/resume messages. Other games must implement the `afterplay:pause` / `afterplay:resume` message protocol to pause their own simulation; opening an overlay alone cannot suspend arbitrary game code.

Loading uses actual file/frame readiness with a short minimum transition, not invented percentage progress. Failed requests show an error and return option; slow loads show a timeout notice. Exiting or restarting cancels stale requests and timers.

Serve locally with any static server, for example `python -m http.server 8000` if Python is installed, then open http://localhost:8000. No build step or backend is required for deployment.

## Game library and cover credits

Open the Library from the home controls or press `L`. Search by title or genre, select a playable game to launch, or open a cover preview for its source and credit. Press Escape or choose Home to return to the shelf. Menu sounds can be turned off in Settings.

The SteamGridDB entries are cover examples. Playable browser games are listed under `games` in `catalog.js`, while cover examples live under `examples` and have no game entry point. Review the original artwork terms before using the example covers on a public deployment.

- Celeste — Ian Wilding (submitted by spine) — https://www.steamgriddb.com/grid/158347
- Getting Over It with Bennett Foddy — Cheap VHS grids — https://www.steamgriddb.com/grid/874074
- Dissidia 012 Final Fantasy — kingsidecastle13 — https://www.steamgriddb.com/grid/874073
- Geometry Dash — Cheap VHS grids — https://www.steamgriddb.com/grid/874071
- GeoGuessr Steam Edition — Cheap VHS grids — https://www.steamgriddb.com/grid/874069
- Twisted Metal 2 — Guiguto — https://www.steamgriddb.com/grid/874065
- Tomb Raider — Guiguto — https://www.steamgriddb.com/grid/874062
- Tomb Raider II — Guiguto — https://www.steamgriddb.com/grid/874061
- Need for Speed III: Hot Pursuit — Guiguto — https://www.steamgriddb.com/grid/874055
- Need for Speed: Porsche Unleashed — Guiguto — https://www.steamgriddb.com/grid/874053
- Medal of Honor — Guiguto — https://www.steamgriddb.com/grid/874050
- Metal Gear Solid: VR Missions — Guiguto — https://www.steamgriddb.com/grid/874048
- Chrono Trigger — Guiguto — https://www.steamgriddb.com/grid/874047
- Chrono Cross — Guiguto — https://www.steamgriddb.com/grid/874046
- Mega Man X4 — Guiguto — https://www.steamgriddb.com/grid/874042
- Mega Man X5 — Guiguto — https://www.steamgriddb.com/grid/874044
