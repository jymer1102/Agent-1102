// Easter egg — background (horizontal / vertical banner)
  let easterActive = localStorage.getItem("agent1102_easter") === "true";
  const easterBtn = document.createElement("button");
  easterBtn.className = "icon-btn"; easterBtn.title = "Toggle background"; easterBtn.innerHTML = '<i class="fa-solid fa-image"></i>'; easterBtn.style.display = easterActive ? "block" : "none";
  headerBtns.prepend(easterBtn);

  // backend/public is the static root, so URLs start at /images/
  const BG_HORIZONTAL = "/images/jymer1102_horizontal_banner.png";
  const BG_VERTICAL   = "/images/jymer1102_vertical_banner.png";
  const portraitQuery = window.matchMedia("(orientation: portrait)");

  function applyEaster() {
    if (easterActive) {
      const img = portraitQuery.matches ? BG_VERTICAL : BG_HORIZONTAL;
      document.body.style.setProperty(
        "background",
        `url('${img}') center/cover no-repeat fixed`,
        "important"
      );
    } else {
      document.body.style.removeProperty("background");
    }
  }

  function toggleEaster() { easterActive = !easterActive; localStorage.setItem("agent1102_easter", easterActive); applyEaster(); easterBtn.style.display = "block"; }

  // Swap image when the device rotates or the window is resized across orientations
  portraitQuery.addEventListener("change", applyEaster);
  applyEaster();
  easterBtn.addEventListener("click", toggleEaster);

  // Easter egg — dino game
  let dinoUnlocked = localStorage.getItem("agent1102_dino") === "true";
  const dinoBtn = document.createElement("button");
  dinoBtn.className = "icon-btn"; dinoBtn.title = "Play Dino Game"; dinoBtn.innerHTML = '<img src="images/dino.png" alt="Dino game">'; dinoBtn.style.display = dinoUnlocked ? "block" : "none";
  headerBtns.prepend(dinoBtn);
  function toggleDino() { window.open("/trex/index.html", "_blank"); }
  dinoBtn.addEventListener("click", toggleDino);

  // Easter egg — PAC-MAN GAME (NEW)
  let pacmanUnlocked = localStorage.getItem("agent1102_pacman") === "true";
  const pacmanBtn = document.createElement("button");
  pacmanBtn.className = "icon-btn"; pacmanBtn.title = "Play Pac-Man Game"; pacmanBtn.innerHTML = '<img src="images/pacman.png" alt="Pac-Man game">'; pacmanBtn.style.display = pacmanUnlocked ? "block" : "none";
  headerBtns.prepend(pacmanBtn);
  function togglePacman() { window.open("/pacman/index.html", "_blank"); }
  pacmanBtn.addEventListener("click", togglePacman);

  // Input easter egg detection
 input.addEventListener("input", () => {
  const val = input.value.trim().toLowerCase();

  if (val === "jymer1102") { 
    input.value = ""; 
    toggleEaster(); 
    showToast(easterActive ? 'Easter egg unlocked! <i class="fa-solid fa-lock-open"></i>' : "Background off!"); 
  }

  if (val === "dinosaur" || val === "trex" || val === "t-rex") { 
    input.value = ""; 
    if (!dinoUnlocked) { 
      dinoUnlocked = true; 
      localStorage.setItem("agent1102_dino","true"); 
      dinoBtn.style.display = "block"; 
      showToast("🦖 Dino game unlocked! Click the T-Rex button anytime to play!"); 
    } 
  }

  if (val === "pac-man" || val === "pacman") { 
    input.value = ""; 
    if (!pacmanUnlocked) { 
      pacmanUnlocked = true; 
      localStorage.setItem("agent1102_pacman","true"); 
      pacmanBtn.style.display = "block"; 
      showToast('<i class="fa-solid fa-ghost"></i> Pac-Man game unlocked! Click the Pac-Man button anytime to play!'); 
    } 
  }

  if (val === "allahu akbar") { 
    input.value = ""; 
    triggerBackpackEgg(); 
  }
});

  // Easter egg — spinning backpack that bursts into stars
  function triggerBackpackEgg() {
    const overlay = document.getElementById("backpack-egg-overlay");
    const wrap = document.getElementById("backpack-egg-wrap");
    const label = document.getElementById("backpack-egg-label");
    overlay.classList.add("active");
    wrap.classList.remove("spinning");
    void wrap.offsetWidth;
    wrap.classList.add("spinning");
    setTimeout(() => label.classList.add("visible"), 600);
    setTimeout(() => {
      overlay.classList.remove("active");
      wrap.classList.remove("spinning");
      label.classList.remove("visible");
      burstBackpackStars();
    }, 1900);
  }

  let backpackParticles = [];
  let backpackAnimId = null;
  const backpackCanvas = document.getElementById("backpack-egg-canvas");
  const backpackCtx = backpackCanvas.getContext("2d");
  backpackCanvas.width = window.innerWidth;
  backpackCanvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    backpackCanvas.width = window.innerWidth;
    backpackCanvas.height = window.innerHeight;
  });

  // Font Awesome solid star (free set) and a vector fallback of the same shape
  const FA_STAR_CHAR = "\uf005";
  const STAR_PATH = new Path2D("M316.9 18C311.6 7 300.4 0 288 0s-23.6 7-28.9 18L182.7 170 10.5 195.1c-12.4 1.8-22.3 10.7-25.2 22.8s1.4 24.7 11 33.1L121 371.1 91.7 502.3c-2.1 12.3 2.9 24.7 12.9 31.8s23 7.3 33.5 1.7L288 458.1l150 78.8c10.5 5.5 23.5 5.4 33.5-.7s15-19.5 12.9-31.8L455 371.1l124.7-120.2c9.6-8.4 13.9-21 11-33.1s-12.8-21-25.2-22.8L393.3 170 316.9 18z");

  // Reads the font family from an existing .fa-solid element so it matches
  // whichever Font Awesome version the HTML loads
  function getFaFont(size) {
    const el = document.querySelector(".fa-solid");
    const family = el ? getComputedStyle(el).fontFamily : '"Font Awesome 6 Free"';
    return `900 ${size}px ${family}`;
  }

  async function burstBackpackStars() {
    // Canvas text doesn't trigger font loading, so load the icon font first
    try { await document.fonts.load(getFaFont(20), FA_STAR_CHAR); } catch (e) {}

    backpackParticles = [];
    cancelAnimationFrame(backpackAnimId);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 / 80) * i + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 14;
      backpackParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 6,
        size: 14 + Math.random() * 28,
        alpha: 1,
        gravity: 0.25 + Math.random() * 0.2,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.3,
        color: Math.random() < 0.5 ? "#FFD700" : "#FFA500",
      });
    }
    animateBackpackStars();
  }

  function animateBackpackStars() {
    backpackCtx.clearRect(0, 0, backpackCanvas.width, backpackCanvas.height);
    backpackParticles = backpackParticles.filter(p => p.alpha > 0.02);

    // If the icon font still isn't available, draw the star as a vector path instead
    const fontReady = document.fonts.check(getFaFont(20), FA_STAR_CHAR);

    for (const p of backpackParticles) {
      p.x += p.vx; p.y += p.vy;
      p.vy += p.gravity; p.vx *= 0.98;
      p.alpha -= 0.018; p.rot += p.rotV;
      backpackCtx.save();
      backpackCtx.globalAlpha = Math.max(0, p.alpha);
      backpackCtx.translate(p.x, p.y);
      backpackCtx.rotate(p.rot);
      backpackCtx.fillStyle = p.color;
      if (fontReady) {
        backpackCtx.font = getFaFont(p.size);
        backpackCtx.textAlign = "center";
        backpackCtx.textBaseline = "middle";
        backpackCtx.fillText(FA_STAR_CHAR, 0, 0);
      } else {
        const s = p.size / 512;            // scale path to particle size
        backpackCtx.scale(s, s);
        backpackCtx.translate(-288, -256); // center the 576x512 path
        backpackCtx.fill(STAR_PATH);
      }
      backpackCtx.restore();
    }
    if (backpackParticles.length > 0) backpackAnimId = requestAnimationFrame(animateBackpackStars);
    else backpackCtx.clearRect(0, 0, backpackCanvas.width, backpackCanvas.height);
  }
