# 🌌 My Universe

> "A little universe made just for you, filled with everything I feel."

`My Universe` is an immersive, personalized 3D web experience designed to showcase custom memories and messages. Built with HTML5, CSS3, and modern ES6 JavaScript modules using **Three.js**, **GSAP**, and **Firebase**, it enables users to design and share a visual space filled with stars, nebulae, shooting stars, 3D text greetings, background music, and interactive memory photos orbiting a central glowing sphere.

---

## ✨ Key Features

- 🛠️ **Dynamic Configuration (Live Customizer)**: Loads distinct user configurations from Firestore based on the `?id=some_id` URL query. Adding `?mode=edit` unlocks a dashboard UI panel to modify parameters in real-time.
- 🎨 **Visual Themes & Presets**: Features 14 distinct theme presets (e.g., *Neon Cyberpunk, Sunset, Deep Space, Rose Teal, Lava, Soft Pastel*) with configurable particle colors, gradient disks, speeds, and sizes.
- 🌸 **Memory Flower Ring System**: A custom-built 3D orbit gallery where uploaded photos float and rotate around the core. Includes device capability profiling (Low, Medium, High tiers) to optimize texture resolutions, material caching, and canvas allocation.
- ❤️ **3D Models & Shaders**: Utilizes GLTF/GLB loaders to render a custom central heart model alongside custom shader-based space dust and nebula clouds.
- 📝 **Ethereal 3D Typography**: Renders customized messages in space using Three.js `FontLoader` with typeface definitions, styled under an `UnrealBloomPass` post-processing pipeline for a dreamy glow.
- 🎵 **Atmospheric Audio Manager**: Features volume control, mute toggles, and tracks like *A Sky Full of Stars* and *Somebody's Pleasure* to enrich the ambient experience.
- 🗺️ **Localization & Multi-Language Support**: Embedded Google Translate support neatly integrated into the overlay interface.
- 🖼️ **EXIF Metadata Reader**: Extracts camera parameters and dates from uploaded user photos to display timelines or tags.

---

## 🛠️ Tech Stack

- **Graphics & Rendering**: [Three.js](https://threejs.org/) (WebGL), `EffectComposer`, `UnrealBloomPass` (Post-processing), `OrbitControls`
- **Animations**: [GSAP (GreenSock)](https://gsap.com/)
- **Database & Storage**: [Firebase (Firestore, Authentication, Storage)](https://firebase.google.com/)
- **Media Hosting**: [Cloudinary](https://cloudinary.com/) (For user photo storage and optimization)
- **Metadata Handling**: [EXIF.js](https://github.com/exif-js/exif-js)
- **Frontend Architecture**: Vanilla HTML5, CSS3 (Custom Glassmorphic Panels & Animations), ES6 JS Modules

---

## 📂 Project Architecture

```
my-universe/
├── assets/
│   ├── fonts/           # Typefaces for 3D Text (e.g. DancingScript)
│   ├── images/          # Default visual textures and loaders
│   └── musics/          # Local sound files for background audio
├── js/
│   ├── audio.js         # Sound manager and audio controls
│   ├── camera.js        # Orbit controls and camera transition scripts
│   ├── dashboard.js     # Live configuration forms & Firestore database sync
│   ├── exif.js          # Metadata reader for uploaded images
│   ├── favicon.js       # Dynamic tab favicon controller
│   ├── heartText.js     # Orchestrator for rendering 3D letters and geometry
│   ├── imageRing.js     # Memory photo cards orbiting logic & optimizations
│   ├── meteors.js       # Shooting stars system particles and logic
│   ├── modelGlb.js      # Loader for central GLB assets (3D Heart)
│   ├── nebula-system.js # Custom shaders and glows for visual nebulas
│   ├── particles.js     # Starfield background and floating space dust
│   └── sphere.js        # Main central sphere particle configuration
├── index.html           # Core HTML skeleton and WebGL renderer initialization
├── styles.css           # Styling rules for loading page, dashboard UI, and overlays
└── README.md            # Project description and documentation
```

### 🧬 Key Classes & Modules

- **[Dashboard](file:///Users/raya/Dev/my-universe/js/dashboard.js) (`js/dashboard.js`)**: Coordinates Firebase connection, handles presets (`PRESETS`), applies user data adjustments, and maintains the customizer modal.
- **[CentralSphere](file:///Users/raya/Dev/my-universe/js/sphere.js) (`js/sphere.js`)**: Instantiates the central rotating points/stars, manages coordinates, and controls parameters like size and rotation velocity.
- **[FlowerRingSystem](file:///Users/raya/Dev/my-universe/js/imageRing.js) (`js/imageRing.js`)**: Manages floating image meshes (referred to as flowers). Implements texture preloading, memory cleanups, and canvas pooling to prevent memory leaks.
- **[CameraController](file:///Users/raya/Dev/my-universe/js/camera.js) (`js/camera.js`)**: Governs mouse and touch OrbitControls interactions.
- **[HeartText](file:///Users/raya/Dev/my-universe/js/heartText.js) (`js/heartText.js`)**: Generates 3D words utilizing typography geometry.
- **[AudioManager](file:///Users/raya/Dev/my-universe/js/audio.js) (`js/audio.js`)**: Facilitates mute toggling, tracks caching, and audio plays sync.

---

## 🎨 Theme Presets Configuration

Below are some of the aesthetic presets supported out-of-the-box by the configuration system:

| Preset Key | Preset Name | Globe Color | Disk Color | Outermost Color | Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `rose-teal` | Rose Teal | `#ff6b6b` | `#ff6b6b` | `#ff6b6b` | Soft romantic colors |
| `purple-pink` | Purple Pink | `#a855f7` | `#a855f7` | `#a855f7` | Vibrant pink and purple nebula disk |
| `ocean-mint` | Ocean Mint | `#00c3ff` | `#00c3ff` | `#00c3ff` | Calming blue and seafoam mint |
| `golden-sunset` | Sunset | `#ffd200` | `#ffd200` | `#ff6b6b` | Golden hour glow |
| `deep-space` | Deep Space | `#4c1d95` | `#4c1d95` | `#8B5CF6` | Dark purple starfield, active meteors |
| `neon-cyber` | Cyberpunk | `#f72585` | `#3a0ca3` | `#4361ee` | Bright neon colors, fast meteors |
| `galaxy-classic`| Classic Galaxy| `#5a189a` | `#3c096c` | `#9d4edd` | Purple galaxy swirl with meteors |
| `monochrome` | Mono | `#ffffff` | `#cccccc` | `#333333` | Minimalist grayscale styling |

---

## 🚀 Running Locally

Because the application uses ES Modules (`import`/`export`) and fetches external assets, opening `index.html` directly as a file (`file://`) will lead to CORS errors. You must serve it using a local web server:

### Option A: Using Python (Pre-installed on macOS/Linux)
Run this command in the project directory:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

### Option B: Using VSCode Live Server
If you use Visual Studio Code, install the **Live Server** extension, open the project workspace, and click the **"Go Live"** button in the bottom status bar.

### Option C: Using Node.js (npx)
If you have Node.js installed, run:
```bash
npx serve .
```

---

## 🔗 Custom URL Configurations

- **Default View**: `http://localhost:8000/?id=my-universe-ae366`
- **Editor Mode**: Append `&mode=edit` to configure and save your own universe settings:
  `http://localhost:8000/?id=my-universe-ae366&mode=edit`
