(() => {
  'use strict';
  const config=window.AFTERPLAY, games=config.games, $=s=>document.querySelector(s);
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('afterplay.'+key))??fallback}catch{return fallback}};
  const save=(key,value)=>{try{localStorage.setItem('afterplay.'+key,JSON.stringify(value))}catch{}};
  let selected=games[0], tab='home', filter='all', favorites=new Set(read('favorites',[])), lastFocus, activeGame, toastTimer;
  const modal=$('#modal'), content=$('#modalContent'), system=$('#systemMenu');
  const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
  function unlocked(g){return !g.pro || Number(read('unlock.'+g.id,0))>Date.now()}
  function visible(){const q=$('#search').value.trim().toLowerCase();return games.filter(g=>(tab!=='favorites'||favorites.has(g.id))&&(filter==='all'||(filter==='free'?!g.pro:g.pro))&&(g.title+' '+g.genre).toLowerCase().includes(q))}

  let backdropRevision = 0;
  function updateBackdrop(source) {
    const layers = [...document.querySelectorAll('.backdrop-art')];
    const current = layers.find(layer => layer.classList.contains('is-current'));
    const revision = ++backdropRevision;
    if (current.getAttribute('src') === source) return;

    if (!current.hasAttribute('src')) {
      current.src = source;
      return;
    }

    const incoming = layers.find(layer => layer !== current);
    incoming.src = source;
    incoming.decode().then(() => {
      if (revision !== backdropRevision) return;
      incoming.classList.add('is-current');
      current.classList.remove('is-current');
    }).catch(() => {});
  }

  function select(game) {
    const changed = selected?.id !== game.id;
    selected = game;
    const title = $('#gameTitle');
    if (changed) {
      playSound();
      title.classList.remove('title-enter');
      void title.offsetWidth;
      title.classList.add('title-enter');
    }
    updateBackdrop(game.art.hero);
    title.textContent = game.title;
    document.querySelectorAll('.game-card').forEach(card => {
      const isSelected = card.dataset.id === game.id;
      card.classList.toggle('selected', isSelected);
      card.setAttribute('aria-pressed', String(isSelected));
    });
    arrangeShelf();
  }

  function render() {
    const list = visible();
    $('#games').innerHTML = list.map(game => `
      <button class="game-card ${game.id === selected.id ? 'selected' : ''}"
        data-id="${safe(game.id)}"
        aria-label="Select ${safe(game.title)}${game.pro ? ', Pro game' : ''}"
        aria-pressed="${game.id === selected.id}">
        <span class="cover-wrap">
          <img src="${safe(game.art.cover)}" alt="" decoding="async">
          ${game.pro ? '<span class="pro-tag">Pro</span>' : ''}
        </span>
      </button>
    `).join('');
    $('#empty').hidden = list.length > 0;
    $('#gameTitle').hidden = list.length === 0;
    $('#play').disabled = list.length === 0;
    document.querySelectorAll('.game-card').forEach(card => {
      const game = games.find(item => item.id === card.dataset.id);
      card.addEventListener('focus', () => select(game));
      card.addEventListener('click', () => select(game));
      card.addEventListener('dblclick', () => launch(game));
    });
    if (list.length && !list.includes(selected)) select(list[0]);
    updateMenu();
    requestAnimationFrame(arrangeShelf);
  }
  function show(html){lastFocus=document.activeElement;if(system.open)system.close();content.innerHTML=html;modal.showModal()}
  function dismiss(){if(modal.open)modal.close();else if(system.open)system.close()}
  modal.querySelector('.close').onclick=dismiss;modal.addEventListener('close',()=>{lastFocus?.focus();if(!libraryOpen){render();select(selected)}});modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismiss()}});
  function pro(){show(`<span class="eyebrow">AFTERPLAY PRO</span><h2>More play. One payment.</h2><p class="price">$4.99 <small style="font-size:13px">USD / one time</small></p><p>Permanent access to every Pro game. No subscription.</p><button class="primary" disabled>Coming soon</button><p>For now, unlock an individual Pro game for ${config.unlockMinutes} minutes with a rewarded ad when available.</p>${config.ads.mode==='demo'?'<small>This preview uses a clearly labeled test unlock. No real ads or payments are active.</small>':''}`)}
  async function launch(g){if(!g||!g.entry||!(libraryOpen?games:visible()).includes(g))return;if(!unlocked(g)){show(`<span class="eyebrow">PRO COLLECTION</span><h2>${safe(g.title)}</h2><p>Watch a rewarded ad to unlock this game for ${config.unlockMinutes} minutes on this browser. Closing before the reward is granted does not unlock it.</p><div class="dialog-actions"><button class="primary" id="watch">${config.ads.mode==='demo'?'Try demo unlock':'Watch ad & unlock'}</button><button class="secondary" id="viewPro">Pro · Coming soon</button></div><p id="adStatus" role="status">${config.ads.mode==='demo'?'Demo mode: this tests the unlock flow. It is not an advertisement.':''}</p>`);$('#viewPro').onclick=()=>{dismiss();pro()};$('#watch').onclick=async()=>{const b=$('#watch'),status=$('#adStatus');b.disabled=true;try{await window.AfterplayAds.watch(config.ads,s=>status.textContent=s);save('unlock.'+g.id,Date.now()+config.unlockMinutes*60000);dismiss();start(g)}catch(e){status.textContent=e.message;b.disabled=false;if(!modal.open&&config.ads.mode==='google'&&!e.message.includes('canceled'))modal.showModal()}};return}start(g)}
  let loadId=0,loadingController,loadTimer,readyTimer;
  const overlay=$('#gameOverlay');
  function toggleOverlay(){if(!activeGame)return;$('#exitGame').textContent=libraryOpen?'Exit to library':'Exit to shelf';if(overlay.open){overlay.close();return}$('#overlayCover').src=activeGame.art.cover;overlay.showModal();$('#frameMount iframe')?.contentWindow.postMessage('afterplay:pause','*');$('#resumeGame').focus()}
  overlay.addEventListener('close',()=>{if(activeGame){$('#frameMount iframe')?.contentWindow.postMessage('afterplay:resume','*');$('#frameMount iframe')?.focus()}});
  overlay.addEventListener('cancel',e=>{e.preventDefault();overlay.close()});
  $('#resumeGame').onclick=()=>overlay.close();$('#cancelLoading').onclick=exit;$('#touchOverlay').onclick=toggleOverlay;
  async function start(g){
    if(!g)return;playSound('launch');if(overlay.open)overlay.close();loadingController?.abort();clearTimeout(loadTimer);clearTimeout(readyTimer);
    const id=++loadId;loadingController=new AbortController();activeGame=g;$('#player').hidden=false;$('.console').inert=true;document.body.classList.add('playing');$('#playingTitle').textContent=g.title;$('#loadingTitle').textContent=g.title;$('#loadingCover').src=g.art.hero;$('#loadingPoster').src=g.art.cover;$('#gameLoading').hidden=false;$('#gameLoading').classList.remove('finished');$('#loadStatus').textContent='Opening game';$('#cancelLoading').textContent='Cancel';$('#frameMount').replaceChildren();
    const begin=performance.now();$('#cancelLoading').focus();
    loadTimer=setTimeout(()=>{if(id===loadId){$('#loadStatus').textContent='This game is taking longer than expected. You can return to the shelf.';$('#cancelLoading').textContent='Return to shelf'}},15000);
    try{
      const url=new URL(g.entry,location.href);
      if(url.origin!==location.origin)throw Error('Host this HTML game with the launcher to enable its console overlay.');
      const response=await fetch(url,{signal:loadingController.signal});if(!response.ok)throw Error('Game file could not be loaded ('+response.status+').');
      const html=await response.text();if(id!==loadId)return;
      const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('base').forEach(b=>b.remove());
      const base=doc.createElement('base');base.href=url.href;doc.head.prepend(base);
      const bridge=doc.createElement('script');bridge.src=new URL('game-bridge.js',location.href).href;base.after(bridge);
      const frame=document.createElement('iframe');frame.title=g.title;frame.setAttribute('sandbox','allow-scripts allow-pointer-lock');frame.allow='fullscreen; gamepad *';frame.allowFullscreen=true;
      frame.onload=()=>{if(id!==loadId)return;clearTimeout(loadTimer);readyTimer=setTimeout(()=>{if(id!==loadId)return;$('#gameLoading').classList.add('finished');readyTimer=setTimeout(()=>{if(id!==loadId)return;$('#gameLoading').hidden=true;if(!overlay.open)frame.focus()},300)},Math.max(0,650-(performance.now()-begin)))};
      frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;$('#frameMount').replaceChildren(frame);save('recent',g.id);
    }catch(error){if(id!==loadId||error.name==='AbortError')return;clearTimeout(loadTimer);$('#loadStatus').textContent=location.protocol==='file:'?'Open this site through a web server or your hosted URL to run games.':error.message;$('#cancelLoading').textContent='Return to shelf'}
  }
  function exit(){const previous=activeGame;loadId++;loadingController?.abort();clearTimeout(loadTimer);clearTimeout(readyTimer);activeGame=null;if(overlay.open)overlay.close();$('#frameMount').replaceChildren();$('#player').hidden=true;$('.console').inert=false;document.body.classList.remove('playing');(libraryOpen ? (libraryGrid.querySelector('.library-card[data-game="'+CSS.escape(previous?.id || '')+'"]') || librarySearch) : document.querySelector('.game-card.selected'))?.focus({preventScroll:!libraryOpen})}

  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Fullscreen is unavailable in this browser.')}}
  $('#play').onclick=()=>launch(selected);$('#pro').onclick=pro;$('#fullscreen').onclick=fullscreen;$('#playerFullscreen').onclick=fullscreen;$('#exitGame').onclick=exit;$('#restartGame').onclick=()=>start(activeGame);
  function toggleFavorite() {
    if (!visible().includes(selected)) return;
    const game = selected;
    if (favorites.has(game.id)) favorites.delete(game.id);
    else favorites.add(game.id);
    save('favorites', [...favorites]);
    render();
    updateMenu();
    toast(favorites.has(game.id) ? 'Saved to favorites' : 'Removed from favorites');
    if (!system.open) document.querySelector('.game-card.selected')?.focus({preventScroll: true});
  }
  function updateMenu() {
    const hasGame = visible().includes(selected);
    $('#details').disabled = !hasGame;
    $('#favorite').disabled = !hasGame;
    $('#favorite').firstChild.textContent = favorites.has(selected.id) ? 'Remove from favorites ' : 'Add to favorites ';
  }
  $('#favorite').onclick = toggleFavorite;
  $('#details').onclick=()=>{const g=selected;if(!visible().includes(g))return;show(`<img class="detail-art" src="${safe(g.art.wide)}" alt=""><span class="eyebrow">${safe(g.genre)}</span><h2><img class="game-icon" src="${safe(g.art.icon)}" alt="">${safe(g.title)}</h2><p>${safe(g.description)}</p><h3>Controls</h3><p>${safe(g.controls)}</p><small>${g.pro?'Pro game · rewarded session unlock':'Free to play'} · Single player</small><br><button id="detailPlay" class="primary">${unlocked(g)?'Play now':'Unlock & play'}</button>`);$('#detailPlay').onclick=()=>{dismiss();launch(g)}};
  $('#searchToggle').onclick=()=>{$('#searchBox').hidden=!$('#searchBox').hidden;if(!$('#searchBox').hidden){$('#search').focus();$('#search').scrollIntoView({block:'center',behavior:'smooth'})}else{$('#search').value='';render()}};$('#search').oninput=render;
  $('#filter').onclick=()=>{filter=filter==='all'?'free':filter==='free'?'pro':'all';$('#filter').textContent={all:'All games ⌄',free:'Free games ⌄',pro:'Pro games ⌄'}[filter];render()};
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(n=>n.classList.toggle('active',n===b));render();$('#collectionName').textContent=tab==='favorites'?'Favorites':'All games';system.close()});
  $('.brand').onclick=openSystem;
  document.body.classList.toggle('reduce-motion',read('reduceMotion',false));
  $('#settings').onclick=()=>{show(`<span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Console settings</h2><label>Reduce motion<input id="motion" type="checkbox" ${read('reduceMotion',false)?'checked':''}></label><label>Menu sounds<input id="menuSound" type="checkbox" ${soundEnabled?'checked':''}></label><p>L opens the game library. Keyboard: arrow keys to browse, Enter to play, S to save to favorites, I for details, F for fullscreen. In a game: Escape or Shift + Tab opens the overlay. Controller: D-pad / left stick to browse, A to select, B to go back.</p><p>Favorites and temporary unlocks stay on this browser. No account required.</p><button id="clear" class="secondary">Reset local data</button>`);$('#menuSound').onchange=e=>{soundEnabled=e.target.checked;save('soundEnabled',soundEnabled)};$('#motion').onchange=e=>{save('reduceMotion',e.target.checked);document.body.classList.toggle('reduce-motion',e.target.checked)};$('#clear').onclick=()=>{if(confirm('Clear favorites, recent game, settings and temporary unlocks?')){try{Object.keys(localStorage).filter(k=>k.startsWith('afterplay.')).forEach(k=>localStorage.removeItem(k))}catch{}favorites.clear();document.body.classList.remove('reduce-motion');dismiss();toast('Local data reset.')}}};
  function moveCard(delta){const cards=[...document.querySelectorAll('.game-card')];if(!cards.length)return;let i=cards.findIndex(b=>b.dataset.id===selected.id);cards[(i+delta+cards.length)%cards.length].focus({preventScroll:true})}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(activeGame){e.preventDefault();toggleOverlay();}else if(modal.open||system.open)dismiss();else if(libraryOpen){closeLibrary();playSound('back')}else openSystem();return}if((modal.open||system.open||overlay.open)&&['ArrowUp','ArrowDown'].includes(e.key)&&e.target.tagName!=='INPUT'){e.preventDefault();const scope=overlay.open?overlay:modal.open?modal:system;const nodes=[...scope.querySelectorAll('button:not(:disabled),input')].filter(n=>n.getClientRects().length);const i=nodes.indexOf(document.activeElement);nodes[(i+(e.key==='ArrowDown'?1:-1)+nodes.length)%nodes.length]?.focus();return}if(activeGame){if(e.key==='Tab'&&e.shiftKey){e.preventDefault();toggleOverlay()}return}if(modal.open||system.open)return;if(libraryOpen){if(e.key==='ArrowDown'&&e.target===librarySearch){e.preventDefault();moveLibrary(0,1)}else if(e.target.closest('.library-card')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();moveLibrary(Number(e.key==='ArrowRight')-Number(e.key==='ArrowLeft'),Number(e.key==='ArrowDown')-Number(e.key==='ArrowUp'))}return}if(/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key.toLowerCase()==='l'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();openLibrary();playSound('confirm');return}if(!e.ctrlKey&&!e.metaKey&&!e.altKey){if(e.key.toLowerCase()==='s'){e.preventDefault();if(!e.repeat)toggleFavorite();return}if(e.key.toLowerCase()==='i'){$('#details').click();return}if(e.key.toLowerCase()==='f'){fullscreen();return}}if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')moveCard(e.key==='ArrowLeft'?-1:1);else document.querySelector('.game-card.selected')?.focus()}if(e.key==='Enter'&&(e.target.classList.contains('game-card')||e.target===document.body)){e.preventDefault();playSound('confirm');launch(selected)}});
  // Games may request returning to the launcher. Only accept the mounted frame.
  window.addEventListener('message',e=>{if(e.source===$('#frameMount iframe')?.contentWindow&&e.data==='afterplay:overlay')toggleOverlay()});
  let lastPad=0,pressed=false;function pads(now){let p;try{p=navigator.getGamepads?.()[0]}catch{};if(p){const a=p.buttons[0]?.pressed,b=p.buttons[1]?.pressed,menu=p.buttons[9]?.pressed,shoulder=p.buttons[4]?.pressed||p.buttons[5]?.pressed;if(menu&&!pressed){if(activeGame)toggleOverlay();else if(system.open)dismiss();else openSystem()}if(activeGame&&!overlay.open){pressed=!!(a||b||menu);requestAnimationFrame(pads);return}if(shoulder&&!pressed&&!activeGame&&!modal.open&&!system.open){if(libraryOpen)closeLibrary();else cycleCollection()};if(a&&!pressed){if(modal.open||system.open||overlay.open){const focus=document.activeElement;if(focus?.tagName==='BUTTON')focus.click()}else if(document.activeElement?.tagName==='BUTTON'&&!document.activeElement.classList.contains('game-card'))document.activeElement.click();else launch(selected)}if(b&&!pressed){if(overlay.open)overlay.close();else if(modal.open||system.open)dismiss();else if(libraryOpen)closeLibrary();else openSystem()};pressed=!!(a||b||menu||shoulder);if(now-lastPad>180){const dx=p.buttons[15]?.pressed||p.axes[0]>.5?1:p.buttons[14]?.pressed||p.axes[0]<-.5?-1:0,dy=p.buttons[13]?.pressed||p.axes[1]>.5?1:p.buttons[12]?.pressed||p.axes[1]<-.5?-1:0;if(dx||dy){if(libraryOpen&&!modal.open&&!system.open&&!overlay.open)moveLibrary(dx,dy);else if(modal.open||system.open||overlay.open||dy){const root=overlay.open?overlay:modal.open?modal:system.open?system:document;const nodes=[...root.querySelectorAll('button:not(:disabled),input')].filter(n=>n.getClientRects().length);const i=nodes.indexOf(document.activeElement);nodes[(i+(dy||dx)+nodes.length)%nodes.length]?.focus()}else moveCard(dx);lastPad=now}}}requestAnimationFrame(pads)}requestAnimationFrame(pads);

  function arrangeShelf() {
    const cards = [...document.querySelectorAll('.game-card')];
    const selectedIndex = cards.findIndex(card => card.dataset.id === selected.id);
    cards.forEach((card, index) => {
      const distance = selectedIndex - index;
      const tilt = Math.sign(distance) * Math.min(34, 17 + Math.abs(distance) * 5);
      card.style.setProperty('--tilt', tilt + 'deg');
    });
    const card = cards[selectedIndex];
    const grid = $('#games');
    const width = $('.shelf-viewport').clientWidth;
    let shift = 0;
    if (card) {
      const edge = cards[0].offsetLeft;
      const right = card.offsetLeft + card.offsetWidth * 1.055;
      shift = width <= 760
        ? Math.min(0, width / 2 - card.offsetLeft - card.offsetWidth / 2)
        : Math.min(0, width - edge - right);
    }
    grid.style.transform = 'translateX(' + shift + 'px)';
  }
  function openSystem(){if(modal.open||activeGame)return;updateMenu();system.showModal();system.querySelector('[data-tab]')?.focus()}
  function cycleCollection(){tab=tab==='favorites'?'home':'favorites';$('#collectionName').textContent=tab==='favorites'?'Favorites':'All games';document.querySelectorAll('[data-tab]').forEach(n=>n.classList.toggle('active',n.dataset.tab===tab));render()}
  $('#menuButton').onclick=openSystem;$('#closeSystem').onclick=()=>system.close();$('#collectionButton').onclick=cycleCollection;
  system.addEventListener('close',()=>!libraryOpen&&!modal.open&&document.querySelector('.game-card.selected')?.focus({preventScroll:true}));
  addEventListener('resize',arrangeShelf);
  let touchX=0;$('.shelf-viewport').addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});$('.shelf-viewport').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)moveCard(dx<0?1:-1)},{passive:true});
  let wheelTime=0;$('.shelf-viewport').addEventListener('wheel',e=>{e.preventDefault();if(Date.now()-wheelTime>180){moveCard((e.deltaX||e.deltaY)>0?1:-1);wheelTime=Date.now()}},{passive:false});


  const libraryView = $('#libraryView');
  const librarySearch = $('#librarySearch');
  const libraryGrid = $('#libraryGrid');
  const allGames = [...games, ...(config.examples || [])];
  let libraryOpen = false;
  let shelfReturnFocus;

  function renderLibrary() {
    const terms = librarySearch.value.trim().toLowerCase().split(/\s+/);
    const results = allGames.filter(game => {
      const searchable = (game.title + ' ' + game.genre).toLowerCase();
      return terms.every(term => searchable.includes(term));
    });
    libraryGrid.innerHTML = results.map(game => `
      <button class="library-card" data-game="${safe(game.id)}">
        <span class="library-cover"><img src="${safe(game.art.cover)}" alt="" loading="lazy" decoding="async"></span>
        <span class="library-name">${safe(game.title)}</span>
        <span class="library-meta">${game.entry ? (game.pro ? 'Pro' : 'Playable') : 'Cover preview'}</span>
      </button>
    `).join('');
    $('#libraryCount').textContent = results.length + (results.length === 1 ? ' game' : ' games');
    $('#libraryEmpty').hidden = results.length > 0;
    $('#libraryResults').scrollTop = 0;
  }

  function openLibrary(focusSearch = true) {
    if (system.open) system.close();
    if (libraryOpen) return;
    shelfReturnFocus = document.activeElement;
    libraryOpen = true;
    $('.console').classList.add('library-open');
    libraryView.hidden = false;
    renderLibrary();
    (focusSearch ? librarySearch : $('#backHome')).focus();
  }

  function closeLibrary() {
    libraryOpen = false;
    libraryView.hidden = true;
    $('.console').classList.remove('library-open');
    const fallback = document.querySelector('.game-card.selected') || $('#openLibrary');
    (shelfReturnFocus instanceof HTMLButtonElement && shelfReturnFocus.getClientRects().length ? shelfReturnFocus : fallback).focus({preventScroll: true});
  }

  function moveLibrary(horizontal, vertical) {
    const cards = [...libraryGrid.querySelectorAll('button')];
    const current = cards.indexOf(document.activeElement);
    if (current < 0) {
      (vertical < 0 ? librarySearch : cards[0] || librarySearch).focus();
      return;
    }
    const columns = getComputedStyle(libraryGrid).gridTemplateColumns.split(' ').length;
    const next = current + horizontal + vertical * columns;
    if (next < 0) librarySearch.focus();
    else cards[Math.min(next, cards.length - 1)]?.focus();
  }

  $('#openLibrary').onclick = () => openLibrary();
  $('#menuLibrary').onclick = () => openLibrary();
  $('#backHome').onclick = closeLibrary;
  librarySearch.addEventListener('input', renderLibrary);
  libraryGrid.addEventListener('click', event => {
    const card = event.target.closest('.library-card');
    if (!card) return;
    const game = allGames.find(item => item.id === card.dataset.game);
    if (game.entry) {
      launch(game);
      return;
    }
    show(`<img class="detail-art example-art" src="${safe(game.art.cover)}" alt="">
      <h2>${safe(game.title)}</h2><p>Cover preview · ${safe(game.genre)}</p>
      <p>Artwork by ${safe(game.artist)}</p>
      <a class="secondary artwork-link" href="${safe(game.source)}" target="_blank" rel="noopener noreferrer">View on SteamGridDB</a>`);
  });

  let audioContext;
  let soundEnabled = read('soundEnabled', true);
  function playSound(kind = 'move') {
    if (!soundEnabled || !navigator.userActivation?.hasBeenActive) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audioContext ??= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const time = audioContext.currentTime;
      const tone = audioContext.createOscillator();
      const volume = audioContext.createGain();
      const pitches = {move: [500, 380], confirm: [460, 690], back: [440, 300], launch: [188, 376]};
      const [from, to] = pitches[kind];
      const duration = kind === 'move' ? .052 : kind === 'launch' ? .24 : .12;
      tone.type = 'sine';
      tone.frequency.setValueAtTime(from, time);
      tone.frequency.exponentialRampToValueAtTime(to, time + duration);
      volume.gain.setValueAtTime(.001, time);
      volume.gain.exponentialRampToValueAtTime(kind === 'move' ? .033 : .045, time + .008);
      volume.gain.exponentialRampToValueAtTime(.001, time + duration);
      tone.connect(volume).connect(audioContext.destination);
      tone.start(time);
      tone.stop(time + duration);
    } catch { /* Audio availability must never block navigation. */ }
  }

  document.addEventListener('click', event => {
    if (event.target.closest('button:not(:disabled)') && !event.target.closest('.game-card')) playSound('confirm');
  });
  libraryGrid.addEventListener('focusin', event => {
    if (event.target.matches('.library-card')) playSound();
  });

  const recent = games.find(game => game.id === read('recent', ''));
  render();
  select(recent || selected);
})();
