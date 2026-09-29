// Easter egg — background (horizontal / vertical banner)
  // Two separate flags: "unlocked" (the button stays for good once you find it) and
  // "active" (whether the background is currently showing).
  let easterActive = localStorage.getItem("agent1102_easter") === "true";
  let easterUnlocked = localStorage.getItem("agent1102_easter_unlocked") === "true" || easterActive; // older saves only had "active"
  if (easterUnlocked) localStorage.setItem("agent1102_easter_unlocked", "true");
  const easterBtn = document.createElement("button");
  easterBtn.className = "icon-btn"; easterBtn.title = "Toggle background"; easterBtn.innerHTML = '<i class="fa-solid fa-image"></i>'; easterBtn.style.display = easterUnlocked ? "flex" : "none";
  headerBtns.prepend(easterBtn);

  // backend/public is the static root, so URLs start at /images/
  const BG_HORIZONTAL = "/images/jymer1102_horizontal_banner.png";
  const BG_VERTICAL   = "/images/jymer1102_vertical_banner.png";
  const portraitQuery = window.matchMedia("(orientation: portrait)");
  const bgLayer = document.getElementById("bg-layer"); // blurred in style.css (--bg-blur)

  function applyEaster() {
    if (easterActive) {
      const img = portraitQuery.matches ? BG_VERTICAL : BG_HORIZONTAL;
      bgLayer.style.backgroundImage = `url('${img}')`;
      bgLayer.style.display = "block";
    } else {
      bgLayer.style.display = "none";
      bgLayer.style.backgroundImage = "";
    }
  }

  function toggleEaster() {
    easterActive = !easterActive;
    localStorage.setItem("agent1102_easter", easterActive);
    // First time: unlock the button permanently. Turning the background off never hides it again.
    easterUnlocked = true;
    localStorage.setItem("agent1102_easter_unlocked", "true");
    easterBtn.style.display = "flex";
    applyEaster();
  }

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

  // Typing a secret word only matters the FIRST time: it unlocks the button.
  // After that the word is left alone (it can be sent as a normal message) and
  // only the header buttons are used.
  if (val === "jymer1102" && !easterUnlocked) { 
    input.value = ""; 
    toggleEaster(); // turns the background on and unlocks the button for good
    showToast('Easter egg unlocked! <i class="fa-solid fa-lock-open"></i> Use the image button to toggle it anytime.');
  }

  if ((val === "dinosaur" || val === "trex" || val === "t-rex") && !dinoUnlocked) { 
    input.value = ""; 
    dinoUnlocked = true; 
    localStorage.setItem("agent1102_dino","true"); 
    dinoBtn.style.display = "block"; 
    showToast("🦖 Dino game unlocked! Click the T-Rex button anytime to play!"); 
  }

  if ((val === "pac-man" || val === "pacman") && !pacmanUnlocked) { 
    input.value = ""; 
    pacmanUnlocked = true; 
    localStorage.setItem("agent1102_pacman","true"); 
    pacmanBtn.style.display = "block"; 
    showToast('<i class="fa-solid fa-ghost"></i> Pac-Man game unlocked! Click the Pac-Man button anytime to play!'); 
  }

  if (val === "allahu akbar") { 
    input.value = ""; 
    triggerBackpackEgg(); 
  }
});

  // Easter egg — spinning backpack that bursts into starbursts
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
      burstBackpackParticles();
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

  // A jagged "burst" shape (like an explosion / comic-book POW), drawn as a
  // canvas path so it doesn't depend on any icon font. Unit radius = 1;
  // spike tips alternate with shallow notches, with a little jitter so
  // every burst looks slightly different.
  function makeBurstPath() {
    const spikes = 8 + Math.floor(Math.random() * 5);   // 8-12 points
    const notch = 0.45 + Math.random() * 0.2;           // how deep the notches cut in
    const path = new Path2D();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes;
      const r = i % 2 === 0 ? 1 - Math.random() * 0.15 : notch;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
    path.closePath();
    return path;
  }

  function burstBackpackParticles() {
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
        shape: makeBurstPath(),
      });
    }
    animateBackpackParticles();
  }

  function animateBackpackParticles() {
    backpackCtx.clearRect(0, 0, backpackCanvas.width, backpackCanvas.height);
    backpackParticles = backpackParticles.filter(p => p.alpha > 0.02);

    for (const p of backpackParticles) {
      p.x += p.vx; p.y += p.vy;
      p.vy += p.gravity; p.vx *= 0.98;
      p.alpha -= 0.018; p.rot += p.rotV;
      backpackCtx.save();
      backpackCtx.globalAlpha = Math.max(0, p.alpha);
      backpackCtx.translate(p.x, p.y);
      backpackCtx.rotate(p.rot);
      backpackCtx.fillStyle = p.color;
      backpackCtx.scale(p.size / 2, p.size / 2);  // shape is unit-radius
      backpackCtx.fill(p.shape);
      backpackCtx.restore();
    }
    if (backpackParticles.length > 0) backpackAnimId = requestAnimationFrame(animateBackpackParticles);
    else backpackCtx.clearRect(0, 0, backpackCanvas.width, backpackCanvas.height);
  }
