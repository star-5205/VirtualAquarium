# 🐟 Virtual Aquarium

> A serene, retro-styled virtual aquarium web application built with **pure HTML5, CSS3, and Vanilla JavaScript** — zero frameworks, zero build tools, zero dependencies.

---

## 🌊 Overview

**Virtual Aquarium** is an interactive, calming web experience that turns your browser into a glowing, retro CRT TV aquarium. Watch vibrant animated pixel-art fish swim across the tank using organic boids-lite wandering physics, feed them drifting pellets, take crisp camera snapshots, listen to ambient lo-fi music, and uncover hidden birthday surprises!

---

## ✨ Features

- 📺 **Retro CRT TV & Glassy Pod Design**:
  - Modular floating pod architecture (Header, Left Controls, Right Utilities, and Footer).
  - CRT TV bezel framing with subtle scanlines, glass glare reflections, and deep ambient glow.
- 🐟 **Pixel-Art Sprite Animation & Boids AI**:
  - 10 unique animated fish color varieties extracted dynamically from a pixel sprite sheet.
  - Heading-based boids-lite wandering steering, soft boundary U-turns, vertical neighbor passing (no overlapping), and relaxed zen gliding pauses.
  - Dynamic horizontal sprite flipping based on movement direction.
- 🪱 **Interactive Click-to-Feed System**:
  - Click anywhere in the tank to drop food pellets (up to 5 active pellets) that drift downward with natural lateral wobbling.
  - Nearest fish dynamically pathfinds to the food, eats it upon contact, and enters a celebratory **3.8-second glowing animation state**.
  - Fish also feature rare, peaceful ambient **bubbling animation states**.
- ➕ **Fish Controls & Dynamic Live Counter**:
  - Add fish button (`+`): Spawns new random fish varieties swimming in from the tank edges with smooth fade-in (up to 10 fish max).
  - Remove fish button (`-`): Fades out and removes fish (minimum 1 fish).
  - Automatic button dimming/disabling at limit thresholds.
  - Live header counter pill: `🐟 X / 10`.
- 🎵 **Lo-Fi Ambient Audio System**:
  - Looping background soundtrack that initializes seamlessly on start screen dismissal.
  - Interactive Mute / Unmute toggle button with dynamic SVG icon swap (`volume-2` / `volume-x`).
  - Real-time footer volume slider.
- 📸 **Canvas Snapshot Tool**:
  - 150ms camera shutter flash effect across the aquarium screen.
  - Direct canvas capture exporting a clean PNG image of the tank without UI buttons (`aquarium-snapshot-[timestamp].png`).
- 🐡 **Secret Easter Egg**:
  - Click the subtle star icon in the right sidebar.
  - Password authentication (`AZKA` / case-insensitive) with wrong-attempt card shake animation.
  - Heartfelt **Birthday Celebration Modal**.
  - Spawns the golden **Pufferfish** into the tank with custom 2-frame squash & bobbing animation!
- 🫧 **Ambient Air Bubbles**:
  - Rising semi-transparent air bubble particles with soft glints and surface bursting.
- 📱 **Fully Responsive Layout**:
  - Seamlessly adapts across desktop, tablet, and mobile displays.

---

## 🕹️ Controls & Interactions

| Action            | Control / Interaction      | Description                                          |
| :---------------- | :------------------------- | :--------------------------------------------------- |
| **Feed Fish**     | Click inside Aquarium Tank | Drops a food pellet at mouse cursor location (max 5) |
| **Add Fish**      | `+` Button (Left Sidebar)  | Spawns a random fish from the edges (max 10)         |
| **Remove Fish**   | `-` Button (Left Sidebar)  | Smoothly despawns a fish (min 1)                     |
| **Snapshot**      | 📷 Camera (Left Sidebar)   | Triggers camera flash and downloads a PNG capture    |
| **Toggle Audio**  | 🔊 Speaker (Right Sidebar) | Mutes / Unmutes background music                     |
| **Adjust Volume** | 🎚️ Slider (Footer)         | Adjusts music volume in real time                    |
| **Help Modal**    | `?` Button (Right Sidebar) | Displays controls guide and shortcuts                |
| **Secret Modal**  | ⭐ Star (Right Sidebar)    | Opens the password prompt for the Easter egg         |
| **Close Modals**  | `ESC` Key / Backdrop / `×` | Closes any currently active modal                    |

---

## 🛠️ Built With

- **HTML5**: Semantic layout and 2D Canvas rendering.
- **CSS3**: Vanilla CSS with custom properties (CSS variables), glassmorphism, flexbox architecture, scanlines, and CRT animations.
- **Vanilla JavaScript (ES6+)**: Custom sprite sheet manager, boids steering physics, particle system, and DOM event controllers.
- **Google Fonts**: [Silkscreen](https://fonts.google.com/specimen/Silkscreen) pixel typography.
- **Lucide Icons**: Crisp SVG iconography.

---

## 🚀 Getting Started

No build steps or dependencies required!

### 1. Clone the repository

```bash
git clone https://github.com/ahmad-cs-u/VirtualAquarium.git
cd VirtualAquarium
```

### 2. Run the application

Simply open `index.html` in your favorite web browser, or serve it using any static local server:

**Using VS Code Live Server:**

- Right-click `index.html` → **Open with Live Server**.

**Using Python:**

```bash
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

---

## 📁 Project Structure

```
VirtualAquarium/
├── assets/
│   ├── background.png            # Aquarium underwater pixel-art backdrop
│   ├── fish_sprite_sheet_64.png  # 64x64 sprite sheet with 10 fish varieties
│   ├── sprite-map.json           # Coordinate mapping for sprite sheet frames
│   ├── food.png                  # Pixel-art food pellet sprite
│   ├── Pufferfish.png            # Special secret Pufferfish sprite
│   ├── music.mp3                 # Lo-fi ambient background music
│   └── star.jpg                  # Browser tab favicon
├── index.html                    # Main HTML markup & modular pod structure
├── style.css                     # Complete styles, CRT frame, & responsive design
├── script.js                     # Core application logic, physics, canvas & audio
└── README.md                     # Project documentation
```

---

## 👨‍💻 Author

**Muhammad Ahmad**

- LinkedIn: [Muhammad Ahmad](https://www.linkedin.com/in/muhammad-ahmad-3b3005304/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
