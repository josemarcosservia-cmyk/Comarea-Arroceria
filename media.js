/* ══════════════════════════════════════════════════════════════
   media.js · Comarea Arrocería
   Fotos y vídeos compartidos por carta.html y videos.html.
   - LAGAR.embed(url)          → cómo incrustar un enlace externo
   - LAGAR.galeria(fotos, i)   → visor de fotos a pantalla completa
   - LAGAR.reels(cont, lista)  → muro de vídeos en vertical
   - LAGAR.verVideos(lista, i) → el mismo muro, en una ventana
   Un vídeo es { src, poster } (archivo propio) o { url } (enlace).
   ══════════════════════════════════════════════════════════════ */
(function(){
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- Enlaces de Instagram, YouTube, TikTok, Facebook ---------- */
  function embed(url){
    if(!url) return null;
    let u; try{ u = new URL(url.trim()); }catch(e){ return null; }
    const h = u.hostname.replace(/^www\.|^m\./,''), p = u.pathname;
    let m;
    if(h === 'youtu.be' && (m = p.match(/^\/([\w-]{6,})/)))
      return { src:`https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&playsinline=1`, red:'YouTube' };
    if(h.endsWith('youtube.com')){
      const id = u.searchParams.get('v') || (p.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)||[])[1];
      if(id) return { src:`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`, red:'YouTube' };
    }
    if(h.endsWith('instagram.com') && (m = p.match(/^\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/)))
      return { src:`https://www.instagram.com/${m[1]==='reels'?'reel':m[1]}/${m[2]}/embed/`, red:'Instagram' };
    if(h.endsWith('tiktok.com') && (m = p.match(/\/video\/(\d+)/)))
      return { src:`https://www.tiktok.com/embed/v2/${m[1]}`, red:'TikTok' };
    if(h.endsWith('facebook.com') || h === 'fb.watch')
      return { src:`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`, red:'Facebook' };
    if(/\.(mp4|webm|mov)(\?|$)/i.test(p)) return { archivo:url };
    return null;
  }

  /* ---------- Estilos (se inyectan una sola vez) ---------- */
  const CSS = `
  .lg-capa{position:fixed;inset:0;z-index:200;background:#000;display:flex;flex-direction:column;
    animation:lgF .2s ease}
  @keyframes lgF{from{opacity:0}to{opacity:1}}
  .lg-cerrar{position:absolute;top:calc(12px + env(safe-area-inset-top));right:12px;z-index:5;width:40px;height:40px;
    border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.5);color:#fff;
    font-size:22px;line-height:1;cursor:pointer;backdrop-filter:blur(6px)}
  .lg-cont{position:absolute;top:calc(20px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:5;
    font:600 12px Raleway,sans-serif;letter-spacing:.12em;color:#fff;background:rgba(0,0,0,.45);
    padding:5px 11px;border-radius:999px}
  .lg-tira{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
  .lg-tira::-webkit-scrollbar{display:none}
  .lg-foto{flex:0 0 100%;scroll-snap-align:center;display:flex;align-items:center;justify-content:center;padding:10px}
  .lg-foto img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}
  .lg-pie{padding:12px 16px calc(16px + env(safe-area-inset-bottom));text-align:center;
    font:500 15px Raleway,sans-serif;color:#fff}
  .lg-flecha{position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:44px;height:44px;border-radius:50%;
    border:none;background:rgba(255,255,255,.14);color:#fff;font-size:24px;cursor:pointer}
  .lg-flecha.i{left:12px} .lg-flecha.d{right:12px}
  @media (hover:none){.lg-flecha{display:none}}

  .lg-reels{height:100%;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none;background:#000}
  .lg-reels::-webkit-scrollbar{display:none}
  .lg-reel{position:relative;height:100%;scroll-snap-align:start;scroll-snap-stop:always;
    display:flex;align-items:center;justify-content:center;overflow:hidden}
  .lg-reel video{width:100%;height:100%;object-fit:contain;background:#000}
  .lg-reel iframe{width:min(100%,420px);height:100%;border:0;background:#111}
  .lg-reel .lg-info{position:absolute;left:0;right:0;bottom:0;pointer-events:none;
    padding:60px 18px calc(22px + env(safe-area-inset-bottom));
    background:linear-gradient(to top,rgba(0,0,0,.75),transparent);font-family:Raleway,sans-serif}
  .lg-reel.emb .lg-info{display:none}
  .lg-info .t{font-size:17px;font-weight:600;color:#fff}
  .lg-info .s{font-size:12.5px;color:#ddd;margin-top:3px}
  .lg-son{position:absolute;right:14px;bottom:calc(24px + env(safe-area-inset-bottom));z-index:3;width:42px;height:42px;
    border-radius:50%;border:none;background:rgba(0,0,0,.5);color:#fff;font-size:18px;cursor:pointer}
  .lg-play{position:absolute;inset:0;margin:auto;width:74px;height:74px;border-radius:50%;pointer-events:none;
    background:rgba(0,0,0,.45);color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;
    opacity:0;transition:opacity .2s}
  .lg-reel.pausa .lg-play{opacity:1}
  .lg-vacio{height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;
    color:#aaa;font:15px/1.7 Raleway,sans-serif}`;
  function estilos(){
    if(document.getElementById('lg-css')) return;
    const s = document.createElement('style'); s.id = 'lg-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function capa(){
    estilos();
    const c = document.createElement('div'); c.className = 'lg-capa';
    c.setAttribute('role','dialog'); c.setAttribute('aria-modal','true');
    const x = document.createElement('button'); x.className = 'lg-cerrar';
    x.setAttribute('aria-label','Cerrar'); x.textContent = '×';
    c.appendChild(x);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const cerrar = () => {
      c.querySelectorAll('video').forEach(v => v.pause());
      c.remove(); document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', tecla);
    };
    const tecla = e => { if(e.key === 'Escape') cerrar(); };
    x.onclick = cerrar;
    document.addEventListener('keydown', tecla);
    document.body.appendChild(c);
    return { c, cerrar, tecla };
  }

  /* ---------- Galería de fotos ---------- */
  function galeria(fotos, inicio, pie){
    if(!fotos || !fotos.length) return;
    const { c } = capa();
    const cont = document.createElement('div'); cont.className = 'lg-cont';
    const tira = document.createElement('div'); tira.className = 'lg-tira';
    fotos.forEach(f => {
      const d = document.createElement('div'); d.className = 'lg-foto';
      d.innerHTML = `<img src="${esc(f)}" alt="">`;
      tira.appendChild(d);
    });
    c.appendChild(tira);
    if(fotos.length > 1){
      c.appendChild(cont);
      const i = document.createElement('button'); i.className='lg-flecha i'; i.textContent='‹';
      const d = document.createElement('button'); d.className='lg-flecha d'; d.textContent='›';
      i.onclick = () => tira.scrollBy({ left:-tira.clientWidth, behavior:'smooth' });
      d.onclick = () => tira.scrollBy({ left: tira.clientWidth, behavior:'smooth' });
      c.appendChild(i); c.appendChild(d);
    }
    if(pie){ const p = document.createElement('div'); p.className='lg-pie'; p.textContent = pie; c.appendChild(p); }
    const contar = () => { cont.textContent = (Math.round(tira.scrollLeft / tira.clientWidth) + 1) + ' / ' + fotos.length; };
    tira.addEventListener('scroll', contar, { passive:true });
    requestAnimationFrame(() => { tira.scrollLeft = (inicio||0) * tira.clientWidth; contar(); });
  }

  /* ---------- Muro de vídeos (reels) ----------
     lista: [{ src, poster, url, t:título, s:subtítulo }] */
  let sonido = false;
  function reels(cont, lista, inicio){
    estilos();
    cont.classList.add('lg-reels');
    cont.innerHTML = '';
    if(!lista.length){
      cont.innerHTML = '<div class="lg-vacio">Todavía no hay vídeos.<br>¡Vuelve pronto!</div>';
      return () => {};
    }
    const slides = lista.map(v => {
      const r = document.createElement('section'); r.className = 'lg-reel';
      const e = v.url ? embed(v.url) : null;
      const archivo = v.src || (e && e.archivo);
      if(archivo){
        const vid = document.createElement('video');
        vid.src = archivo; if(v.poster) vid.poster = v.poster;
        vid.playsInline = true; vid.loop = true; vid.muted = !sonido; vid.preload = 'metadata';
        vid.setAttribute('playsinline','');
        r.appendChild(vid);
        r.insertAdjacentHTML('beforeend', '<div class="lg-play">▶</div>');
        const son = document.createElement('button'); son.className = 'lg-son';
        son.setAttribute('aria-label','Sonido');
        const pintaSon = () => son.textContent = sonido ? '🔊' : '🔇';
        pintaSon();
        son.onclick = ev => {
          ev.stopPropagation(); sonido = !sonido;
          cont.querySelectorAll('video').forEach(x => x.muted = !sonido);
          cont.querySelectorAll('.lg-son').forEach(b => b.textContent = sonido ? '🔊' : '🔇');
        };
        r.appendChild(son);
        vid.addEventListener('click', () => {
          if(vid.paused){ vid.play().catch(()=>{}); r.classList.remove('pausa'); }
          else { vid.pause(); r.classList.add('pausa'); }
        });
      }else if(e){
        r.classList.add('emb');
        const f = document.createElement('iframe');
        f.dataset.src = e.src; f.title = v.t || ('Vídeo de ' + e.red);
        f.allow = 'autoplay; encrypted-media; picture-in-picture; clipboard-write';
        f.setAttribute('allowfullscreen',''); f.loading = 'lazy';
        r.appendChild(f);
      }else{
        r.innerHTML = '<div class="lg-vacio">Este enlace de vídeo no es válido.</div>';
      }
      if(v.t || v.s){
        const info = document.createElement('div'); info.className = 'lg-info';
        info.innerHTML = (v.t ? `<div class="t">${esc(v.t)}</div>` : '') + (v.s ? `<div class="s">${esc(v.s)}</div>` : '');
        r.appendChild(info);
      }
      cont.appendChild(r);
      return r;
    });

    const io = new IntersectionObserver(entradas => entradas.forEach(en => {
      const r = en.target, vid = r.querySelector('video'), f = r.querySelector('iframe');
      if(en.isIntersecting && en.intersectionRatio > .6){
        if(vid){ vid.muted = !sonido; vid.play().then(() => r.classList.remove('pausa')).catch(() => r.classList.add('pausa')); }
        if(f && f.src !== f.dataset.src) f.src = f.dataset.src;
      }else{
        if(vid && !vid.paused) vid.pause();
        if(f && f.getAttribute('src')) f.removeAttribute('src');   // para detener el vídeo externo
      }
    }), { root: cont, threshold:[0, .6] });
    slides.forEach(s => io.observe(s));
    if(inicio) requestAnimationFrame(() => { cont.scrollTop = inicio * cont.clientHeight; });
    return () => io.disconnect();
  }

  function verVideos(lista, inicio){
    const { c } = capa();
    const muro = document.createElement('div'); muro.style.height = '100%';
    c.insertBefore(muro, c.firstChild);
    reels(muro, lista, inicio);
  }

  window.LAGAR = { embed, galeria, reels, verVideos, esc };
})();
