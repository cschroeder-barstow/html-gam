# AFTERPLAY hosting guide for beginners

You’ll set up two things. **GitHub Pages** publishes the public launcher and free demo games. **Cloudflare** hosts a separate player that checks who can open private games. You can do the whole GitHub section in your browser and File Explorer. The Cloudflare section explains what you can set up in the dashboard and where the current AFTERPLAY project needs development work.

## Part 1 — Publish the free demo on GitHub Pages

### Step 1. Extract the site on Windows

1. [Download AFTERPLAY.zip](https://chatgpt.com/library?file_id=libfile_0da37cb82f048191a3cbd9516928669a&account_id=personal).
2. Open **File Explorer → Downloads**. Right-click the ZIP, choose **Extract All**, then click **Extract**.
3. Keep the original as a backup. Make a separate copy of the extracted folder named **AFTERPLAY-PUBLIC**. Work in that copy.
4. Open it. Look for the folder that directly contains `index.html`, `catalog.js`, `app.js`, `assets`, and `games`. That is the site root. You’ll upload the contents of that folder.

### Step 2. Check what will be public

Anyone can download files from a public repository, even before Pages is enabled. Only upload games, images, and other material you're comfortable sharing publicly and have permission to publish. Keep passwords, API keys, and any private game folders outside the upload copy.

**A correction about the current ZIP:** Signal / Lost and Ember share `games/engine.js` with the free games. Moving only `snake.html` and `match.html` would leave their gameplay logic in the public engine and leave broken launch entries. For a quick demo, treat the bundled games as public samples if you’re comfortable sharing them. If you want either bundled game to stay private, have its logic split out of the public engine and its catalog entry hidden or redirected before uploading. New private games should go in separate folders from the start.

### Step 3. Make the GitHub repository

1. Sign in at [GitHub](https://github.com/).
2. Click **+** near the top right, then **New repository**.
3. Set **Owner** to your account and **Repository name** to `afterplay`.
4. Choose **Public** for a GitHub Free Pages demo.
5. Enable **Add a README file** if offered. That gives the repository a default branch to upload into.
6. Click **Create repository**. You should land on the repo’s **Code** tab.

### Step 4. Upload the public files

1. In the repo, click **Add file → Upload files**. On an empty repo, GitHub may show an upload link in the quick setup area.
2. Open the site root in File Explorer. Drag the files and folders inside it into the GitHub upload area. Keep `assets` and `games` as folders. Upload the extracted contents, not the ZIP.
3. Review the list before committing. Check that it contains no private games or credentials. If there’s already a GitHub README, you can skip the local README or replace the default one.
4. Click **Commit changes**. If GitHub asks where to commit, use the default branch, usually `main`.
5. Back on **Code**, confirm `index.html` is immediately visible beside `assets` and `games`. If you have to open another AFTERPLAY folder before you can see it, the site files are one level too deep.

### Step 5. Turn on GitHub Pages

1. In your repo, click **Settings → Pages**.
2. Under **Build and deployment → Source**, select **Deploy from a branch**.
3. Choose **main** (or the branch you uploaded to) and **/(root)**. Click **Save**.
4. Open **Actions** and check the Pages deployment. Wait for it to finish successfully.
5. Go back to **Settings → Pages** and click **Visit site**. If the username is `galaxydevvv` and the repository is `afterplay`, the address should be [galaxydevvv.github.io/afterplay](https://galaxydevvv.github.io/afterplay/).
6. Open that address in a private browser window. Check the art, press **L** for the library, and launch **Midnight Run**. After it opens, try **Esc** or **Shift + Tab** to exit through the game overlay.

**If the page gives a 404**, check the Pages build and confirm the right branch and folder are selected. **If the shelf loads but the art or game doesn’t**, check that the relevant files are in the repo, with the same capitalization as their paths in `catalog.js`. Test using the published HTTPS site. Opening the extracted HTML directly is only a preview of the shelf.

Official steps: [Configure a GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Part 2 — Prepare a private Cloudflare player

Start with **one test game and your own email**. You can use Cloudflare’s default player address and add a domain later. The R2 bucket stores the files, the Worker serves them, and Cloudflare Access can make invited players sign in for this first test.

### Step 6. Create a private R2 bucket

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and select your account.
2. Open **R2 Object Storage**. If prompted to activate R2, review the billing screen. The Standard tier has a free allowance, and usage beyond it can cost money.
3. Choose **Create bucket**, name it `afterplay-private-games`, and choose **Standard** storage if asked.
4. Open the bucket’s **Settings**. Keep **Public Development URL** disabled and **Custom Domains** empty. The Worker will read files through a private connection to the bucket.
5. In the bucket’s **Objects** view, upload the test game and its dependencies. Preserve relative paths. For example, if a game’s page refers to `engine.js` and `game.css` in the same directory, put all three under the same prefix, such as `ember/index.html`, `ember/engine.js`, and `ember/game.css`. Include any images, sounds, and fonts the game uses.
6. Check the object names and letter case. At this point the files should be visible in your Cloudflare dashboard, and there should be no public bucket URL to share.

Official guides: [Get started with R2](https://developers.cloudflare.com/r2/get-started/) · [R2 public access settings](https://developers.cloudflare.com/r2/buckets/public-buckets/) · [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

### Step 7. Create the Worker and connect the bucket

1. Go to **Workers & Pages** in the same Cloudflare account. Create a **Worker** using the starter option, name it `afterplay-player`, and deploy it.
2. Open the Worker, then **Bindings → Add binding → R2 bucket**. If the navigation differs, look for **Bindings** in its settings.
3. Select `afterplay-private-games` and use `GAMES` as the binding name. Save the binding and deploy if prompted. A binding is the named connection that lets the Worker read this bucket.
4. Open the Worker address from its dashboard. It will look like `afterplay-player.<your-subdomain>.workers.dev`. The starter response confirms the Worker is online. It does not yet serve your game.

Official guide: [Use R2 from Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/).

### Step 8. Lock down the player before adding file delivery

1. Follow [Cloudflare’s Protect one Worker steps](https://developers.cloudflare.com/workers/configuration/cloudflare-access/#protect-one-worker) for **afterplay-player**. Protect its **production** address. Protect any preview addresses too, or disable previews you don’t need.
2. Add an **Allow** policy for your exact email address. Use a sign-in method available in your setup, such as a one-time email PIN. Add only the email addresses you intend to invite.
3. Open the Worker address in a private browser window. You should see a sign-in screen or an access denial. Sign in with your allowed email and check that you can reach the starter response.
4. If you later add a second player hostname, verify protection on that address too.

This gives you a private test for invited players. It does not automatically know who paid or watched an ad. For that later, AFTERPLAY needs accounts and a server-side record of which games each player may load. A verified payment or a supported server-side ad reward updates that record. AFTERPLAY’s current demo unlock lives in browser storage and does not enforce private access.

### Step 9. Connect the game and the Play button

**This is the handoff point.** The current ZIP does not have the Worker’s file-serving behavior or a protected-game launch path. Creating a bucket and a binding does not make the integration work by itself.

- **On Cloudflare:** Have the Worker map each game URL to its files in R2. Apply access checks to the whole game path, including direct requests for scripts, art, and sounds. Return each file with the right type and use private or no-store caching for restricted responses. Keep the storage connection on the Worker.
- **On GitHub Pages:** Have protected games open the Worker player as a separate page. AFTERPLAY currently only supports same-origin entries in its built-in player, so pasting a Cloudflare URL into the existing entry won’t work. Add a **Back to AFTERPLAY** link on the Cloudflare player. The GitHub launcher can keep its existing player for the free games.
- **If you want one seamless player:** Host the launcher and private routes together on Cloudflare and keep GitHub as the source repository. That also gives you a separate place to build paid Pro. See [GitHub Pages usage limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

### Step 10. Test the result

| Test | What you should see |
| --- | --- |
| GitHub demo in a private window | The launcher and free games work without signing in |
| Direct private game URL while signed out | A sign-in prompt or denial |
| Direct protected script or image URL while signed out | A sign-in prompt or denial, just like the game page |
| Signing in with your allowed email | The game and all its assets load |
| Signing in with an email outside the policy | Access is denied |
| Any preview or alternate player URL | Also protected, or disabled |
| Public GitHub repository file list | Only files you intended to distribute publicly |

If the private page opens but it’s blank or has no art, check the object paths, capitalization, and file types. If the starter page still appears at the game address after sign-in, the Worker’s game routes aren’t connected yet. If a direct game file loads while signed out, fix the protection before sharing the link.

This setup controls **who receives the game files**. A browser that can play a game receives the files it uses and can save a copy. Keep anything that needs to stay secret from players on the server.
