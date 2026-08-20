// ============================================================
// Virtual Aquarium — script.js
// Phases 1 - 5: Layout, Canvas, Boids Movement, Food System,
// Behavior States & Fish Controls (Add / Remove / Counter / Limits).
// ============================================================

'use strict';

// ---- DOM References ----
const startScreen   = document.getElementById('start-screen');
const appContainer  = document.getElementById('app-container');
const tankCanvas    = document.getElementById('tank-canvas');
const tankFrame     = document.getElementById('tank-frame');
const fishCounter   = document.getElementById('fish-counter');

// Sidebar buttons
const btnAddFish    = document.getElementById('btn-add-fish');
const btnRemoveFish = document.getElementById('btn-remove-fish');
const btnSnapshot   = document.getElementById('btn-snapshot');
const btnSound      = document.getElementById('btn-sound');
const btnHelp       = document.getElementById('btn-help');
const btnSecret     = document.getElementById('btn-secret');

// Sound icons
const iconSoundOn   = document.getElementById('icon-sound-on');
const iconSoundOff  = document.getElementById('icon-sound-off');

// Volume slider
const volumeSlider  = document.getElementById('volume-slider');

// Modals
const helpModal     = document.getElementById('help-modal');
const secretModal   = document.getElementById('secret-modal');
const birthdayModal = document.getElementById('birthday-modal');
const secretInput   = document.getElementById('secret-input');
const secretSubmit  = document.getElementById('secret-submit');
const secretError   = document.getElementById('secret-error');

// Flash overlay
const flashOverlay  = document.getElementById('flash-overlay');


// ============================================================
// PHASE 6: AUDIO SYSTEM
// ============================================================

const bgAudio = new Audio('assets/music.mp3');
bgAudio.loop = true;
bgAudio.volume = volumeSlider ? volumeSlider.value / 100 : 0.5;
let isAudioStarted = false;
let isMuted = false;

/**
 * Updates the sound icon and tooltip based on mute/volume state.
 */
function updateAudioUI() {
    if (isMuted || bgAudio.volume === 0) {
        iconSoundOn.classList.add('hidden');
        iconSoundOff.classList.remove('hidden');
        btnSound.setAttribute('aria-label', 'Unmute Sound');
        btnSound.setAttribute('data-tooltip', 'Unmute');
    } else {
        iconSoundOn.classList.remove('hidden');
        iconSoundOff.classList.add('hidden');
        btnSound.setAttribute('aria-label', 'Mute Sound');
        btnSound.setAttribute('data-tooltip', 'Mute');
    }
}

/**
 * Starts background music playback on user gesture.
 */
function startAudioPlayback() {
    if (isAudioStarted) return;
    isAudioStarted = true;
    bgAudio.muted = isMuted;
    bgAudio.play().then(() => {
        console.log('[Audio] Lo-fi background track playing successfully.');
        updateAudioUI();
    }).catch(err => {
        console.log('[Audio] Audio playback info:', err.message);
    });
}

/**
 * Toggles audio mute state.
 */
function toggleMute() {
    isMuted = !isMuted;
    bgAudio.muted = isMuted;

    if (!isMuted && bgAudio.paused) {
        bgAudio.play().catch(() => {});
    }

    updateAudioUI();
}

// Sidebar sound toggle button
btnSound.addEventListener('click', toggleMute);

// Volume slider handling
if (volumeSlider) {
    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        bgAudio.volume = val / 100;

        if (val === 0 && !isMuted) {
            isMuted = true;
            bgAudio.muted = true;
        } else if (val > 0 && isMuted) {
            isMuted = false;
            bgAudio.muted = false;
            if (bgAudio.paused && isAudioStarted) {
                bgAudio.play().catch(() => {});
            }
        }

        updateAudioUI();
    };

    volumeSlider.addEventListener('input', handleVolumeChange);
    volumeSlider.addEventListener('change', handleVolumeChange);
}


// ============================================================
// START SCREEN
// ============================================================
startScreen.addEventListener('click', () => {
    startScreen.classList.add('hidden');

    startScreen.addEventListener('transitionend', () => {
        startScreen.remove();
    }, { once: true });

    // Start audio on user gesture (satisfies browser autoplay policies)
    startAudioPlayback();
});


// ============================================================
// MODAL HELPERS
// ============================================================

function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) closeModal(modal);
    });
});

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
        const modal = backdrop.closest('.modal');
        if (modal) closeModal(modal);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            closeModal(modal);
        });
    }
});

btnHelp.addEventListener('click', () => {
    openModal(helpModal);
});


// ============================================================
// PHASE 7: SNAPSHOT FEATURE
// ============================================================

/**
 * Captures the canvas as a PNG, triggers a shutter flash, and initiates file download.
 */
function takeSnapshot() {
    if (!tankCanvas) return;

    // 1. Shutter White Flash Animation
    if (flashOverlay) {
        flashOverlay.classList.add('flash');
        setTimeout(() => {
            flashOverlay.classList.remove('flash');
        }, 150);
    }

    // 2. Capture canvas and trigger download
    try {
        const dataUrl = tankCanvas.toDataURL('image/png');
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') + '-' +
            String(now.getMinutes()).padStart(2, '0') + '-' +
            String(now.getSeconds()).padStart(2, '0');

        const filename = `aquarium-snapshot-${timestamp}.png`;
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`[Snapshot] Successfully captured and downloaded ${filename}`);
    } catch (err) {
        console.error('[Snapshot] Failed to capture canvas snapshot:', err);
    }
}

btnSnapshot.addEventListener('click', takeSnapshot);


// ============================================================
// PHASE 9: SECRET FEATURE & PUFFERFISH
// ============================================================

const pufferfishImage = new Image();
pufferfishImage.src = 'assets/Pufferfish.png';

/**
 * Represents the special secret Pufferfish with 2-frame bobbing & floating animation.
 */
class Pufferfish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseSpeed = 0.45;
        this.speed = this.baseSpeed;
        this.heading = (Math.random() - 0.5) * 0.6;
        this.targetHeading = this.heading;
        this.wanderTimer = 0;
        this.wanderInterval = 2400;
        this.flipX = false;
        this.scale = 2.0; // Clear pixel size

        // 2-frame squash and bob animation
        this.bobTime = 0;
        this.frameTimer = 0;
        this.frameIndex = 0;

        this.opacity = 0;
        this.isFadingIn = true;
    }

    update(dt, canvasWidth, canvasHeight) {
        const timeFactor = dt / 16.67;
        this.bobTime += dt * 0.004;

        if (this.isFadingIn) {
            this.opacity = Math.min(1, this.opacity + dt / 800);
            if (this.opacity >= 1) this.isFadingIn = false;
        }

        // 2-frame bob animation cycle
        this.frameTimer += dt;
        if (this.frameTimer >= 300) {
            this.frameTimer -= 300;
            this.frameIndex = (this.frameIndex + 1) % 2;
        }

        // Ambient gentle wandering
        this.wanderTimer += dt;
        if (this.wanderTimer >= this.wanderInterval) {
            this.wanderTimer = 0;
            this.wanderInterval = 2200 + Math.random() * 2200;
            const swimRight = Math.random() > 0.5;
            const baseAngle = swimRight ? 0 : Math.PI;
            this.targetHeading = baseAngle + (Math.random() - 0.5) * 0.6;
        }

        // Boundary avoidance
        const marginX = 130;
        const marginY = 90;
        let avoidX = 0, avoidY = 0;
        if (this.x < marginX) avoidX += (marginX - this.x) / marginX;
        else if (this.x > canvasWidth - marginX) avoidX -= (this.x - (canvasWidth - marginX)) / marginX;

        if (this.y < marginY) avoidY += (marginY - this.y) / marginY;
        else if (this.y > canvasHeight - marginY) avoidY -= (this.y - (canvasHeight - marginY)) / marginY;

        if (avoidX !== 0 || avoidY !== 0) {
            const inward = Math.atan2(avoidY, avoidX);
            this.targetHeading = inward;
        }

        let diff = (this.targetHeading - this.heading) % (Math.PI * 2);
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        this.heading += diff * 0.04 * timeFactor;

        this.vx = Math.cos(this.heading) * this.speed;
        this.vy = Math.sin(this.heading) * this.speed * 0.5;

        this.x += this.vx * timeFactor;
        this.y += this.vy * timeFactor;

        const padX = this.scale * 18;
        const padY = this.scale * 18;
        this.x = Math.max(padX, Math.min(canvasWidth - padX, this.x));
        this.y = Math.max(padY, Math.min(canvasHeight - padY, this.y));

        if (this.vx > 0.05) this.flipX = true;
        else if (this.vx < -0.05) this.flipX = false;
    }

    draw(targetCtx) {
        if (!pufferfishImage.complete || pufferfishImage.naturalWidth === 0 || this.opacity <= 0) return;

        targetCtx.save();
        targetCtx.globalAlpha = this.opacity;

        // Visual 2-frame vertical bob + gentle squash/stretch
        const bobY = Math.sin(this.bobTime) * 3;
        const squashScaleY = this.scale * (1 + (this.frameIndex === 0 ? 0.06 : -0.06));
        const squashScaleX = this.scale * (1 - (this.frameIndex === 0 ? 0.06 : -0.06));

        targetCtx.translate(this.x, this.y + bobY);
        if (this.flipX) {
            targetCtx.scale(-1, 1);
        }

        const width = pufferfishImage.naturalWidth * squashScaleX;
        const height = pufferfishImage.naturalHeight * squashScaleY;

        targetCtx.drawImage(
            pufferfishImage,
            -width / 2,
            -height / 2,
            width,
            height
        );
        targetCtx.restore();
    }
}

let secretPufferfish = null;

/**
 * Validates password and triggers birthday celebration + Pufferfish spawn.
 */
function handleSecretSubmit() {
    const entered = secretInput.value.trim().toUpperCase();
    if (entered === 'AZKA') {
        secretError.classList.add('hidden');
        secretInput.value = '';
        closeModal(secretModal);
        openModal(birthdayModal);

        // Spawn Pufferfish into tank if not already present
        if (!secretPufferfish) {
            const width = tankCanvas.width || 800;
            const height = tankCanvas.height || 400;
            secretPufferfish = new Pufferfish(width * 0.5, height * 0.35);
            console.log('[Secret] Pufferfish unlocked & spawned!');
        }
    } else {
        secretError.textContent = 'Incorrect password. Try again…';
        secretError.classList.remove('hidden');

        // Trigger error shake animation
        const card = secretModal.querySelector('.modal-card');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // Force reflow
            card.classList.add('shake');
        }
    }
}

btnSecret.addEventListener('click', () => {
    secretInput.value = '';
    secretError.classList.add('hidden');
    openModal(secretModal);
    setTimeout(() => secretInput.focus(), 60);
});

secretSubmit.addEventListener('click', handleSecretSubmit);

secretInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleSecretSubmit();
    }
});


// ============================================================
// ASSETS & SPRITE SHEET MANAGER
// ============================================================

const ctx = tankCanvas.getContext('2d');

const bgImage = new Image();
bgImage.src = 'assets/background.png';

const foodImage = new Image();
foodImage.src = 'assets/food.png';

/**
 * Manages sprite sheet extraction, frame mapping, and drawing.
 */
class SpriteSheetManager {
    constructor() {
        this.image = null;
        this.map = null;
        this.frameSize = 64;
        this.fishTypes = [];
        this.isLoaded = false;
    }

    async load() {
        try {
            const [img, mapData] = await Promise.all([
                new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = 'assets/fish_sprite_sheet_64.png';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                }),
                fetch('assets/sprite-map.json').then(r => r.json())
            ]);

            this.image = img;
            this.map = mapData;
            this.frameSize = mapData.frameSize || 64;
            this.fishTypes = mapData.fish.map(f => f.name);
            this.isLoaded = true;
            console.log(`[SpriteSheetManager] Loaded ${this.fishTypes.length} fish varieties:`, this.fishTypes);
        } catch (err) {
            console.error('[SpriteSheetManager] Failed to load assets:', err);
        }
    }

    getFrameCoords(fishName, status = 'simple', direction = 'left', frameIndex = 0) {
        if (!this.map) return { col: 0, row: 0 };
        const fishData = this.map.fish.find(f => f.name === fishName);
        if (!fishData) return { col: 0, row: 0 };

        let stateObj = fishData.states.find(s => s.status === status && s.direction === direction);
        if (!stateObj) {
            stateObj = fishData.states.find(s => s.status === status) || fishData.states[0];
        }

        const frames = stateObj.frames;
        return frames[frameIndex % frames.length];
    }

    drawFish(targetCtx, fishName, status, direction, frameIndex, x, y, scale = 1.6, flipX = false) {
        if (!this.isLoaded) return;
        const { col, row } = this.getFrameCoords(fishName, status, direction, frameIndex);
        const sSize = this.frameSize;
        const sx = col * sSize;
        const sy = row * sSize;
        const dWidth = sSize * scale;
        const dHeight = sSize * scale;

        targetCtx.save();
        targetCtx.translate(x, y);
        if (flipX) {
            targetCtx.scale(-1, 1);
        }

        // Center fish sprite at (x, y)
        targetCtx.drawImage(
            this.image,
            sx, sy, sSize, sSize,
            -dWidth / 2, -dHeight / 2, dWidth, dHeight
        );
        targetCtx.restore();
    }
}

const spriteManager = new SpriteSheetManager();


// ============================================================
// PHASE 4: FOOD CLASS
// ============================================================

/**
 * Represents a single food pellet sinking in the aquarium.
 */
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0.32 + Math.random() * 0.12; // Slow gentle sinking
        this.wobbleTime = Math.random() * 10;
        this.scale = 2.0; // Sharp pixel size
        this.age = 0;
        this.lifespan = 14000; // 14 seconds before decay
        this.isEaten = false;
        this.claimedBy = null; // Fish pursuing this pellet
        this.opacity = 1;
    }

    update(dt, canvasHeight) {
        const timeFactor = dt / 16.67;
        this.age += dt;
        this.wobbleTime += dt * 0.003;

        // Slow sinking with subtle lateral drift
        this.y += this.vy * timeFactor;
        this.x += Math.sin(this.wobbleTime) * 0.18 * timeFactor;

        // Bottom floor settle
        const bottomMargin = 45;
        if (this.y > canvasHeight - bottomMargin) {
            this.y = canvasHeight - bottomMargin;
        }

        // Smooth fade out near end of life
        if (this.age > this.lifespan - 2500) {
            this.opacity = Math.max(0, (this.lifespan - this.age) / 2500);
        }
    }

    draw(targetCtx) {
        if (!foodImage.complete || foodImage.naturalWidth === 0 || this.opacity <= 0) return;
        targetCtx.save();
        targetCtx.globalAlpha = this.opacity;
        const size = 16 * this.scale;
        targetCtx.drawImage(
            foodImage,
            this.x - size / 2,
            this.y - size / 2,
            size,
            size
        );
        targetCtx.restore();
    }
}

const activeFoods = [];


// ============================================================
// FISH CLASS (Boids Steering, Behavior States & Fade In/Out)
// ============================================================

/**
 * Represents an individual animated fish with Boids steering, food seeking,
 * behavior states ("simple", "glowing", "bubbling"), and spawn/despawn fades.
 */
class Fish {
    constructor(type, x, y, scale = 1.6, isSpawning = false, initialHeading = null) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.scale = scale;

        // Fade In / Out states (Phase 5)
        this.opacity = isSpawning ? 0 : 1;
        this.isFadingIn = isSpawning;
        this.isFadingOut = false;

        // Behavior State: 'simple' | 'glowing' | 'bubbling'
        this.state = 'simple';
        this.stateTimer = 0;
        this.direction = 'left';

        // Animation
        this.frameIndex = Math.floor(Math.random() * 4);
        this.frameTimer = Math.random() * 100;
        this.baseFrameInterval = 160; // ms per frame
        this.frameInterval = this.baseFrameInterval;

        // Physics & Steering
        this.baseSpeed = 0.65 + Math.random() * 0.4;
        this.speed = this.baseSpeed;
        this.heading = initialHeading !== null ? initialHeading : Math.random() * Math.PI * 2;
        this.targetHeading = this.heading;
        this.wanderChangeTimer = 0;
        this.wanderInterval = 1200 + Math.random() * 1800;

        this.vx = Math.cos(this.heading) * this.speed;
        this.vy = Math.sin(this.heading) * this.speed * 0.6;
        this.flipX = this.vx > 0;

        // Food seeking
        this.targetFood = null;

        // Zen Pausing / Gliding
        this.isPausing = false;
        this.pauseTimer = 0;
        this.nextPauseInterval = 7000 + Math.random() * 10000;
        this.pauseDuration = 2000 + Math.random() * 1500;
        this.bobTime = Math.random() * 100;
    }

    update(dt, allFishes, canvasWidth, canvasHeight, foods) {
        const timeFactor = dt / 16.67; // Normalized to 60fps
        this.bobTime += dt * 0.003;

        // ------------------------------------------------------------
        // 0. FADE IN / FADE OUT
        // ------------------------------------------------------------
        if (this.isFadingIn) {
            this.opacity = Math.min(1, this.opacity + dt / 600); // 0.6s fade in
            if (this.opacity >= 1) {
                this.isFadingIn = false;
            }
        } else if (this.isFadingOut) {
            this.opacity = Math.max(0, this.opacity - dt / 500); // 0.5s fade out
        }

        // ------------------------------------------------------------
        // 1. STATE MANAGEMENT (Glowing & Bubbling)
        // ------------------------------------------------------------
        if (this.state === 'glowing') {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = 'simple';
            }
        } else if (this.state === 'bubbling') {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = 'simple';
            }
        } else {
            // In 'simple' state: rare chance to enter bubbling state if calm
            if (!this.targetFood && !this.isPausing && !this.isFadingOut && Math.random() < 0.0008 * timeFactor) {
                this.state = 'bubbling';
                this.stateTimer = 2600; // 2.6s of bubbling
            }
        }

        // ------------------------------------------------------------
        // 2. FOOD SEEKING BEHAVIOR
        // ------------------------------------------------------------
        let isSeekingFood = false;

        if (this.targetFood && !this.isFadingOut) {
            if (this.targetFood.isEaten || this.targetFood.opacity <= 0.1 || !foods.includes(this.targetFood)) {
                this.targetFood = null;
            }
        }

        if (this.targetFood && !this.isFadingOut) {
            isSeekingFood = true;
            this.isPausing = false;

            const dx = this.targetFood.x - this.x;
            const dy = this.targetFood.y - this.y;
            const dist = Math.hypot(dx, dy);

            this.targetHeading = Math.atan2(dy, dx);

            if (dist < 22) {
                this.targetFood.isEaten = true;
                this.targetFood = null;
                this.state = 'glowing';
                this.stateTimer = 3800;
                this.wanderChangeTimer = 0;
                this.targetHeading += (Math.random() - 0.5) * 1.5;
            }
        }

        // ------------------------------------------------------------
        // 3. ZEN PAUSING & GLIDING
        // ------------------------------------------------------------
        if (!isSeekingFood && !this.isFadingOut) {
            this.pauseTimer += dt;
            if (!this.isPausing && this.pauseTimer >= this.nextPauseInterval) {
                this.isPausing = true;
                this.pauseTimer = 0;
            } else if (this.isPausing && this.pauseTimer >= this.pauseDuration) {
                this.isPausing = false;
                this.pauseTimer = 0;
                this.nextPauseInterval = 8000 + Math.random() * 12000;
                this.targetHeading += (Math.random() - 0.5) * 1.5;
            }
        }

        // ------------------------------------------------------------
        // 4. OPEN-WATER WANDERING STEERING
        // ------------------------------------------------------------
        if (!isSeekingFood && !this.isPausing) {
            this.wanderChangeTimer += dt;
            if (this.wanderChangeTimer >= this.wanderInterval) {
                this.wanderChangeTimer = 0;
                this.wanderInterval = 1600 + Math.random() * 2200;
                const swimRight = Math.random() > 0.5;
                const baseAngle = swimRight ? 0 : Math.PI;
                const variance = (Math.random() - 0.5) * 0.75;
                this.targetHeading = baseAngle + variance;
            }
        }

        // ------------------------------------------------------------
        // 5. BOUNDARY AVOIDANCE STEERING
        // ------------------------------------------------------------
        const marginX = 120;
        const marginY = 80;
        let avoidForceX = 0;
        let avoidForceY = 0;

        if (this.x < marginX) {
            avoidForceX += (marginX - this.x) / marginX;
        } else if (this.x > canvasWidth - marginX) {
            avoidForceX -= (this.x - (canvasWidth - marginX)) / marginX;
        }

        if (this.y < marginY) {
            avoidForceY += (marginY - this.y) / marginY;
        } else if (this.y > canvasHeight - marginY) {
            avoidForceY -= (this.y - (canvasHeight - marginY)) / marginY;
        }

        if (avoidForceX !== 0 || avoidForceY !== 0) {
            const inwardAngle = Math.atan2(avoidForceY, avoidForceX);
            const avoidWeight = Math.min(1, Math.hypot(avoidForceX, avoidForceY) * 1.6);
            this.targetHeading = inwardAngle * avoidWeight + this.targetHeading * (1 - avoidWeight);
        }

        // ------------------------------------------------------------
        // 6. NEIGHBOR SEPARATION & VERTICAL PASSING
        // ------------------------------------------------------------
        const sepDist = 95;
        let sepX = 0;
        let sepY = 0;

        for (const other of allFishes) {
            if (other === this || other.isFadingOut) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.hypot(dx, dy);

            if (dist < sepDist && dist > 0.001) {
                const strength = (1 - dist / sepDist);
                sepX += (dx / dist) * strength * 0.75;
                const verticalBias = this.y >= other.y ? 0.45 : -0.45;
                sepY += ((dy / dist) * strength + verticalBias) * 0.75;
            }
        }

        // ------------------------------------------------------------
        // 7. SMOOTH ANGULAR INTERPOLATION
        // ------------------------------------------------------------
        let angleDiff = (this.targetHeading - this.heading) % (Math.PI * 2);
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnSpeed = isSeekingFood ? 0.09 : ((avoidForceX !== 0 || avoidForceY !== 0) ? 0.08 : 0.038);
        this.heading += angleDiff * turnSpeed * timeFactor;

        // ------------------------------------------------------------
        // 8. VELOCITY & POSITION INTEGRATION
        // ------------------------------------------------------------
        let targetSpeed = this.baseSpeed;
        if (isSeekingFood) {
            targetSpeed = this.baseSpeed * 1.35;
        } else if (this.isPausing) {
            targetSpeed = this.baseSpeed * 0.18;
        }

        this.speed += (targetSpeed - this.speed) * 0.06 * timeFactor;

        let vx = Math.cos(this.heading) * this.speed + sepX * 0.5;
        let vy = Math.sin(this.heading) * this.speed * 0.65 + sepY * 0.5;

        if (this.isPausing && !isSeekingFood) {
            vy += Math.sin(this.bobTime) * 0.08;
        }

        this.vx = vx;
        this.vy = vy;

        this.x += this.vx * timeFactor;
        this.y += this.vy * timeFactor;

        const padX = this.scale * 26;
        const padY = this.scale * 22;
        this.x = Math.max(padX, Math.min(canvasWidth - padX, this.x));
        this.y = Math.max(padY, Math.min(canvasHeight - padY, this.y));

        if (this.vx > 0.08) {
            this.flipX = true;
        } else if (this.vx < -0.08) {
            this.flipX = false;
        }

        // ------------------------------------------------------------
        // 9. ANIMATION FRAME CYCLING
        // ------------------------------------------------------------
        let frameSpeedMultiplier = 1;
        if (this.isPausing && !isSeekingFood) frameSpeedMultiplier = 2.2;
        if (isSeekingFood) frameSpeedMultiplier = 0.75;

        this.frameInterval = this.baseFrameInterval * frameSpeedMultiplier;
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer -= this.frameInterval;
            this.frameIndex = (this.frameIndex + 1) % 4;
        }
    }

    draw(targetCtx) {
        if (this.opacity <= 0) return;
        targetCtx.save();
        targetCtx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
        spriteManager.drawFish(
            targetCtx,
            this.type,
            this.state,
            this.direction,
            this.frameIndex,
            this.x,
            this.y,
            this.scale,
            this.flipX
        );
        targetCtx.restore();
    }
}

const fishes = [];


// ============================================================
// PHASE 5: FISH CONTROLS (ADD / REMOVE / BUTTON LIMITS)
// ============================================================

/**
 * Returns the number of active (non-fading) fish.
 */
function getActiveFishCount() {
    return fishes.filter(f => !f.isFadingOut).length;
}

/**
 * Updates the fish counter and dims/disables add/remove buttons at limits.
 */
function updateControlButtons() {
    const activeCount = getActiveFishCount();

    if (fishCounter) {
        fishCounter.textContent = `🐟 ${activeCount} / 10`;
    }

    // Add button: disabled when cap (10) reached
    if (activeCount >= 10) {
        btnAddFish.classList.add('disabled');
        btnAddFish.setAttribute('aria-disabled', 'true');
    } else {
        btnAddFish.classList.remove('disabled');
        btnAddFish.removeAttribute('aria-disabled');
    }

    // Remove button: disabled when minimum (1) reached
    if (activeCount <= 1) {
        btnRemoveFish.classList.add('disabled');
        btnRemoveFish.setAttribute('aria-disabled', 'true');
    } else {
        btnRemoveFish.classList.remove('disabled');
        btnRemoveFish.removeAttribute('aria-disabled');
    }
}

// Add Fish button listener
btnAddFish.addEventListener('click', () => {
    const activeCount = getActiveFishCount();
    if (activeCount >= 10) return;

    const availableTypes = spriteManager.fishTypes.length > 0 
        ? spriteManager.fishTypes 
        : ['dark-blue', 'pink', 'orange', 'gold', 'turquoise', 'purple', 'red', 'green'];

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const width = tankCanvas.width || 800;
    const height = tankCanvas.height || 400;

    // Pick random spawn side (left or right edge)
    const fromLeft = Math.random() > 0.5;
    const scale = 1.4 + Math.random() * 0.4;
    const padX = scale * 28;
    const x = fromLeft ? padX + 5 : width - padX - 5;
    const y = height * (0.25 + Math.random() * 0.5);

    // Initial heading swimming inward
    const initialHeading = fromLeft 
        ? (Math.random() - 0.5) * 0.6 
        : Math.PI + (Math.random() - 0.5) * 0.6;

    const newFish = new Fish(randomType, x, y, scale, true, initialHeading);
    fishes.push(newFish);

    updateControlButtons();
});

// Remove Fish button listener
btnRemoveFish.addEventListener('click', () => {
    const activeFishes = fishes.filter(f => !f.isFadingOut);
    if (activeFishes.length <= 1) return;

    // Remove the most recently added active fish
    const fishToRemove = activeFishes[activeFishes.length - 1];
    fishToRemove.isFadingOut = true;

    updateControlButtons();
});


// ============================================================
// CLICK TO SPAWN FOOD
// ============================================================

function handleTankClick(e) {
    if (activeFoods.length >= 5) return;

    const rect = tankCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (tankCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (tankCanvas.height / rect.height);

    if (x >= 20 && x <= tankCanvas.width - 20 && y >= 20 && y <= tankCanvas.height - 20) {
        activeFoods.push(new Food(x, y));
    }
}

tankCanvas.addEventListener('click', handleTankClick);
tankFrame.addEventListener('click', (e) => {
    if (e.target !== tankCanvas) {
        handleTankClick(e);
    }
});

function updateFoodTargeting() {
    if (activeFoods.length === 0 || fishes.length === 0) return;

    for (const food of activeFoods) {
        if (food.isEaten || food.opacity <= 0.1) continue;

        if (food.claimedBy && fishes.includes(food.claimedBy) && food.claimedBy.targetFood === food && !food.claimedBy.isFadingOut) {
            continue;
        }

        let closestFish = null;
        let closestDist = Infinity;

        for (const fish of fishes) {
            if (fish.isFadingOut) continue;
            const dist = Math.hypot(fish.x - food.x, fish.y - food.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestFish = fish;
            }
        }

        if (closestFish) {
            food.claimedBy = closestFish;
            closestFish.targetFood = food;
        }
    }
}


// ============================================================
// CANVAS RESIZING & INITIALIZATION
// ============================================================

function resizeCanvas() {
    const rect = tankFrame.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        tankCanvas.width = Math.floor(rect.width);
        tankCanvas.height = Math.floor(rect.height);
        ctx.imageSmoothingEnabled = false;
    }
}

function initDefaultFish() {
    fishes.length = 0;
    const availableTypes = spriteManager.fishTypes.length > 0 
        ? spriteManager.fishTypes 
        : ['dark-blue', 'pink', 'orange', 'gold', 'turquoise', 'purple'];

    const shuffled = [...availableTypes].sort(() => 0.5 - Math.random());
    const width = tankCanvas.width || 800;
    const height = tankCanvas.height || 400;

    for (let i = 0; i < 3; i++) {
        const type = shuffled[i % shuffled.length];
        const x = width * (0.2 + Math.random() * 0.6);
        const y = height * (0.25 + Math.random() * 0.5);
        const scale = 1.4 + Math.random() * 0.4;
        fishes.push(new Fish(type, x, y, scale, false));
    }

    updateControlButtons();
}


// ============================================================
// PHASE 10: AMBIENT AIR BUBBLE PARTICLES
// ============================================================

/**
 * Represents a gentle rising ambient bubble in the aquarium.
 */
class Bubble {
    constructor(canvasWidth, canvasHeight, randomizeY = false) {
        this.reset(canvasWidth, canvasHeight, randomizeY);
    }

    reset(canvasWidth, canvasHeight, randomizeY = false) {
        this.x = Math.random() * (canvasWidth || 800);
        this.y = randomizeY 
            ? Math.random() * (canvasHeight || 400) 
            : (canvasHeight || 400) + 10 + Math.random() * 25;
        this.radius = 1.4 + Math.random() * 2.4; // Soft subtle size
        this.vy = -(0.32 + Math.random() * 0.38); // Gentle upward drift
        this.wobbleSpeed = 0.002 + Math.random() * 0.003;
        this.wobbleAmp = 0.35 + Math.random() * 0.45;
        this.time = Math.random() * 100;
        this.alpha = 0.18 + Math.random() * 0.22; // Low contrast, unobtrusive
    }

    update(dt, canvasWidth, canvasHeight) {
        const timeFactor = dt / 16.67;
        this.time += dt * this.wobbleSpeed;
        this.y += this.vy * timeFactor;
        this.x += Math.sin(this.time) * this.wobbleAmp * timeFactor;

        // Reset if reached near water surface
        if (this.y < 16) {
            this.reset(canvasWidth, canvasHeight, false);
        }
    }

    draw(targetCtx) {
        targetCtx.save();
        
        // Outer subtle cyan/teal bubble body
        targetCtx.beginPath();
        targetCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        targetCtx.fillStyle = `rgba(204, 251, 241, ${this.alpha * 0.35})`;
        targetCtx.fill();
        targetCtx.strokeStyle = `rgba(240, 253, 250, ${this.alpha * 0.8})`;
        targetCtx.lineWidth = 1;
        targetCtx.stroke();

        // Soft glint reflection
        targetCtx.beginPath();
        targetCtx.arc(this.x - this.radius * 0.32, this.y - this.radius * 0.32, this.radius * 0.28, 0, Math.PI * 2);
        targetCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 1.1})`;
        targetCtx.fill();

        targetCtx.restore();
    }
}

const bubbles = [];

function initBubbles(count = 16) {
    bubbles.length = 0;
    const width = tankCanvas.width || 800;
    const height = tankCanvas.height || 400;
    for (let i = 0; i < count; i++) {
        bubbles.push(new Bubble(width, height, true));
    }
}


// ============================================================
// MAIN GAME / RENDER LOOP
// ============================================================

let lastTimestamp = 0;

function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(timestamp - lastTimestamp, 100);
    lastTimestamp = timestamp;

    const width = tankCanvas.width;
    const height = tankCanvas.height;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // 2. Draw Background
    if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bgImage, 0, 0, width, height);
    }

    // 3. Update and Draw Ambient Bubbles (Phase 10)
    for (const bubble of bubbles) {
        bubble.update(dt, width, height);
        bubble.draw(ctx);
    }

    // 4. Update Food Targeting & Physics
    updateFoodTargeting();

    for (let i = activeFoods.length - 1; i >= 0; i--) {
        const food = activeFoods[i];
        food.update(dt, height);
        food.draw(ctx);

        if (food.isEaten || food.age >= food.lifespan || food.opacity <= 0) {
            activeFoods.splice(i, 1);
        }
    }

    // 5. Update and Draw Fish (Clean up fully faded-out fish)
    for (let i = fishes.length - 1; i >= 0; i--) {
        const fish = fishes[i];
        fish.update(dt, fishes, width, height, activeFoods);
        fish.draw(ctx);

        if (fish.isFadingOut && fish.opacity <= 0) {
            fishes.splice(i, 1);
        }
    }

    // 6. Update and Draw Secret Pufferfish (if unlocked)
    if (secretPufferfish) {
        secretPufferfish.update(dt, width, height);
        secretPufferfish.draw(ctx);
    }

    requestAnimationFrame(gameLoop);
}

// Window resize listener
window.addEventListener('resize', () => {
    const oldWidth = tankCanvas.width;
    const oldHeight = tankCanvas.height;
    resizeCanvas();

    if (oldWidth > 0 && oldHeight > 0 && tankCanvas.width > 0 && tankCanvas.height > 0) {
        const scaleX = tankCanvas.width / oldWidth;
        const scaleY = tankCanvas.height / oldHeight;
        for (const fish of fishes) {
            fish.x *= scaleX;
            fish.y *= scaleY;
        }
        for (const food of activeFoods) {
            food.x *= scaleX;
            food.y *= scaleY;
        }
        for (const bubble of bubbles) {
            bubble.x *= scaleX;
            bubble.y *= scaleY;
        }
        if (secretPufferfish) {
            secretPufferfish.x *= scaleX;
            secretPufferfish.y *= scaleY;
        }
    }
});

// App Initialization
async function initApp() {
    resizeCanvas();
    await spriteManager.load();
    initDefaultFish();
    initBubbles(16);
    requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
