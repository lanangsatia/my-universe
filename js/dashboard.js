/**
 * dashboard.js
 * Handles user dashboard using Firebase Firestore and Storage.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDzbRlY-OxLJJSp6jJPGqz6MTNzYegBuGk",
    authDomain: "my-universe-ae366.firebaseapp.com",
    projectId: "my-universe-ae366",
    storageBucket: "my-universe-ae366.firebasestorage.app",
    messagingSenderId: "627784339059",
    appId: "1:627784339059:web:3ba09b3b40b2f7d66e2406",
    measurementId: "G-TN805V3TQ5"
};

const CLOUDINARY_CLOUD_NAME = "dgszbva8w";
const CLOUDINARY_UPLOAD_PRESET = "my_universe";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const PRESETS = {
    'rose-teal': {
        name: 'Rose Teal', globeColor: '#ff6b6b', particleColor: '#4ecdc4', diskColor: '#ff6b6b',
        innerDiskColor: '#ffccf2', outermostColor: '#ff6b6b', backgroundColor: '#4ecdc4000000', isGradient: true
    },
    'purple-pink': {
        name: 'Purple Pink', globeColor: '#a855f7', particleColor: '#ec4899', diskColor: '#a855f7',
        innerDiskColor: '#f5d0fe', outermostColor: '#a855f7', backgroundColor: '#ec4899', isGradient: true
    },
    'ocean-mint': {
        name: 'Ocean Mint', globeColor: '#00c3ff', particleColor: '#43cea2', diskColor: '#00c3ff',
        innerDiskColor: '#ccfbf1', outermostColor: '#00c3ff', backgroundColor: '#43cea2', isGradient: true
    },
    'golden-sunset': {
        name: 'Sunset', globeColor: '#ffd200', particleColor: '#ff6b6b', diskColor: '#ffd200',
        innerDiskColor: '#fef9c3', outermostColor: '#ff6b6b', backgroundColor: '#ff6b6b', isGradient: true
    },
    'emerald-sea': {
        name: 'Emerald', globeColor: '#11998e', particleColor: '#38bdf8', diskColor: '#11998e',
        innerDiskColor: '#ccfbf1', outermostColor: '#38bdf8', backgroundColor: '#38bdf8', isGradient: true
    },
    'deep-space': {
        name: 'Deep Space', globeColor: '#4c1d95', particleColor: '#8B5CF6', diskColor: '#4c1d95',
        innerDiskColor: '#ede9fe', outermostColor: '#8B5CF6', backgroundColor: '#8B5CF6', isGradient: false
    },
    'neon-cyber': {
        name: 'Cyberpunk', globeColor: '#f72585', particleColor: '#4cc9f0', diskColor: '#3a0ca3',
        innerDiskColor: '#7209b7', outermostColor: '#4361ee', backgroundColor: '#4361ee', isGradient: true
    },
    'magic-forest': {
        name: 'Magic Forest', globeColor: '#2d6a4f', particleColor: '#95d5b2', diskColor: '#1b4332',
        innerDiskColor: '#d8f3dc', outermostColor: '#52b788', backgroundColor: '#52b788', isGradient: true
    },
    'royal-gold': {
        name: 'Royal Gold', globeColor: '#997b66', particleColor: '#ffcc00', diskColor: '#8a5a44',
        innerDiskColor: '#ede0d4', outermostColor: '#b08968', backgroundColor: '#b08968', isGradient: false
    },
    'midnight-blue': {
        name: 'Midnight', globeColor: '#03045e', particleColor: '#00b4d8', diskColor: '#023e8a',
        innerDiskColor: '#caf0f8', outermostColor: '#0077b6', backgroundColor: '#0077b6', isGradient: true
    },
    'lava-fire': {
        name: 'Lava', globeColor: '#9b2226', particleColor: '#ee9b00', diskColor: '#ae2012',
        innerDiskColor: '#e9d8a6', outermostColor: '#ca6702', backgroundColor: '#ca6702', isGradient: true
    },
    'galaxy-classic': {
        name: 'Classic Galaxy', globeColor: '#5a189a', particleColor: '#ff00ff', diskColor: '#3c096c',
        innerDiskColor: '#e0aaff', outermostColor: '#9d4edd', backgroundColor: '#ff00ff', isGradient: true
    },
    'soft-pastel': {
        name: 'Soft Pastel', globeColor: '#ffafcc', particleColor: '#a2d2ff', diskColor: '#ffc8dd',
        innerDiskColor: '#cdb4db', outermostColor: '#bde0fe', backgroundColor: '#bde0fe', isGradient: true
    },
    'monochrome': {
        name: 'Mono', globeColor: '#ffffff', particleColor: '#666666', diskColor: '#cccccc',
        innerDiskColor: '#ffffff', outermostColor: '#333333', backgroundColor: '#333333', isGradient: false
    }
};

const DEFAULT_DATA = {
    greetingText: "Hi ",
    questionText: "Wanna see something cute?",
    globeText: "Hi",
    photos: [
        "assets/images/loading-love.png"
    ],
    globeColor: '#a855f7',
    particleColor: '#ec4899',
    diskColor: '#a855f7',
    innerDiskColor: '#f5d0fe',
    outermostColor: '#ec4899',
    backgroundColor: '#ec4899',
    isGradient: true,
    size: 9,
    rotationSpeed: 0.002,
    particleSpeed: 2.0,
    centralHeartEnabled: false,
    text3dEnabled: true,
    nebulaEnabled: false,
    textColor: 0xffffff
};

class Dashboard {
    constructor() {
        this.userId = this.getUserIdFromUrl();
        this.userData = null;
        this.isDashboardVisible = false;
        this.db = firebase.firestore();

        if (this.userId) {
            this.init();
        }
    }

    isEditMode() {
        const params = new URLSearchParams(window.location.search);
        return params.get('mode') === 'edit';
    }

    getUserIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async init() {
        const fetchResult = await this.fetchData(this.userId);
        if (fetchResult) {
            this.userData = fetchResult.data;
            this.applyDataToScene();

            if (fetchResult.exists && this.isEditMode()) {
                this.createDashboardButton();
                this.createDashboardModal();
                this.setupEvents();
            }
        }
        this.hideLoadingOverlay();
    }

    hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('flower-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.8s ease-out';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 800);
        }
    }

    async fetchData(id) {
        try {
            const doc = await this.db.collection('user_configs').doc(id).get();

            // Create a local copy of DEFAULT_DATA and set the ID
            const baseData = { ...DEFAULT_DATA, id: id };

            if (doc.exists) {
                const fetchedData = doc.data();

                // Handle missing or empty photos by using defaults
                if (!fetchedData.photos || fetchedData.photos.length === 0) {
                    fetchedData.photos = baseData.photos;
                }

                // Merge fetched data over base data to ensure all fields exist
                return {
                    data: { ...baseData, ...fetchedData },
                    exists: true
                };
            } else {
                // If document doesn't exist, return default data
                return {
                    data: baseData,
                    exists: false
                };
            }
        } catch (error) {
            console.error('Error fetching data from Firestore:', error);
            // Fallback to default data even on error, so the app doesn't break
            return {
                data: { ...DEFAULT_DATA, id: id },
                exists: false
            };
        }
    }

    applyDataToScene() {
        if (!this.userData) return;

        // Texts
        const greetingTextElement = document.getElementById('greetingText');
        const questionTextElement = document.getElementById('questionText');
        if (greetingTextElement && this.userData.greetingText) greetingTextElement.textContent = this.userData.greetingText;
        if (questionTextElement && this.userData.questionText) questionTextElement.textContent = this.userData.questionText;

        // 3D Scene
        const updateSphere = () => {
            if (window.centralSphere) {
                window.centralSphere.updateConfig({
                    color1: this.userData.globeColor,
                    color2: this.userData.particleColor,
                    size: this.userData.size || 9,
                    rotationSpeed: this.userData.rotationSpeed || 0.002,
                    particleSpeed: this.userData.particleSpeed || 2.0,
                    isGradient: this.userData.isGradient,
                    diskColor: this.userData.diskColor,
                    innerDiskColor: this.userData.innerDiskColor,
                    outermostColor: this.userData.outermostColor,
                    backgroundColor: this.userData.backgroundColor,
                    nebulaEnabled: this.userData.nebulaEnabled,
                    centralHeartEnabled: this.userData.centralHeartEnabled,
                    text3dEnabled: this.userData.text3dEnabled,
                    text3d: {
                        text: this.userData.globeText,
                        color: this.userData.textColor || 0xffffff,
                        size: 30,
                        fontName: 'plusjakartasans',
                        effectType: 'none',
                        appearEffect: 'none'
                    }
                });
            }
        };

        if (window.centralSphere) updateSphere();
        else document.addEventListener('sphere_ready', updateSphere);

        // Photos
        const photosToUse = (this.userData.photos && this.userData.photos.length > 0)
            ? this.userData.photos
            : DEFAULT_DATA.photos;

        window.dispatchEvent(new CustomEvent('update_photos', { detail: photosToUse }));
    }

    createDashboardButton() {
        if (document.getElementById('dashboard-toggle-btn')) return;
        const btn = document.createElement('div');
        btn.id = 'dashboard-toggle-btn';
        btn.innerHTML = '<i class="fas fa-cog"></i>';
        btn.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 50px; height: 50px;
            background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px);
            color: white; border-radius: 50%; display: flex; align-items: center;
            justify-content: center; cursor: pointer; z-index: 10001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.3s;
        `;
        btn.onclick = () => this.toggleDashboard();
        document.body.appendChild(btn);
    }

    createDashboardModal() {
        if (document.getElementById('dashboard-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.className = 'dashboard-modal hidden';
        modal.innerHTML = `
            <div class="dashboard-content">
                <div class="dashboard-header">
                    <h2>Editor Universe</h2>
                    <span class="close-dashboard" id="close-dashboard-btn">&times;</span>
                </div>
                <div class="dashboard-tabs">
                    <button class="tab-btn active" data-tab="tab-template">Templates</button>
                    <button class="tab-btn" data-tab="tab-visual">Visuals</button>
                    <button class="tab-btn" data-tab="tab-text">Texts</button>
                    <button class="tab-btn" data-tab="tab-photos">Photos</button>
                </div>
                <div class="dashboard-body">
                    <div id="tab-template" class="tab-pane active">
                        <div class="preset-grid">
                            ${Object.keys(PRESETS).map(key => `
                                <div class="preset-item" style="background:${PRESETS[key].globeColor}" onclick="window.dashboard.applyPreset('${key}')">
                                    <span>${PRESETS[key].name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div id="tab-visual" class="tab-pane">
                        <div class="color-row">
                            <div class="f-group"><label>Globe Primary</label><input type="color" id="in-clr-globe" value="${this.userData.globeColor}"></div>
                            <div class="f-group"><label>Globe Secondary</label><input type="color" id="in-clr-part" value="${this.userData.particleColor}"></div>
                        </div>
                        <div class="form-group">
                            <label>Globe Size</label>
                            <input type="range" id="in-val-size" min="5" max="15" step="0.5" value="${this.userData.size || 9}">
                        </div>
                        <div class="form-group">
                            <label>Particle Speed</label>
                            <input type="range" id="in-val-pspeed" min="0.5" max="10" step="0.5" value="${this.userData.particleSpeed || 2.0}">
                        </div>
                        <div class="color-row">
                            <div class="f-group"><label>Disk Color</label><input type="color" id="in-clr-disk" value="${this.userData.diskColor}"></div>
                            <div class="f-group"><label>Inner Disk</label><input type="color" id="in-clr-inner" value="${this.userData.innerDiskColor}"></div>
                        </div>
                        <div class="color-row">
                            <div class="f-group"><label>Outer Disk</label><input type="color" id="in-clr-outer" value="${this.userData.outermostColor}"></div>
                            <div class="f-group"><label>Space Color</label><input type="color" id="in-clr-bg" value="${this.userData.backgroundColor}"></div>
                        </div>
                        <div class="toggle-row">
                            <label><input type="checkbox" id="in-tog-heart" ${this.userData.centralHeartEnabled ? 'checked' : ''}> Central Heart</label>
                            <label><input type="checkbox" id="in-tog-text" ${this.userData.text3dEnabled !== false ? 'checked' : ''}> Show 3D Text</label>
                            <label><input type="checkbox" id="in-tog-nebula" ${this.userData.nebulaEnabled ? 'checked' : ''}> Enable Nebula</label>
                            <label><input type="checkbox" id="in-tog-grad" ${this.userData.isGradient ? 'checked' : ''}> Gradient Globe</label>
                        </div>
                    </div>
                    <div id="tab-text" class="tab-pane">
                        <div class="form-group"><label>Greeting Header</label><input type="text" id="in-greet" value="${this.userData.greetingText}"></div>
                        <div class="form-group"><label>Question Text</label><input type="text" id="in-quest" value="${this.userData.questionText}"></div>
                        <div class="form-group"><label>3D Globe Text</label><input type="text" id="in-globe" value="${this.userData.globeText}"></div>
                    </div>
                    <div id="tab-photos" class="tab-pane">
                        <div id="photo-grid" class="photo-grid"></div>
                        <button class="add-photo-btn" id="btn-add-photo"><i class="fas fa-plus"></i> Add Photo</button>
                        <input type="file" id="photo-upload" style="display:none" accept="image/*">
                    </div>
                </div>
                <div class="dashboard-footer">
                    <button class="btn-save" id="btn-save-final">Save Universe</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const style = document.createElement('style');
        style.textContent = `
            .dashboard-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 10002; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
            .dashboard-modal.active { opacity: 1; pointer-events: auto; }
            .dashboard-content { background: #111; width: 90%; max-width: 450px; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            .dashboard-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
            .dashboard-header h2 { margin: 0; color: #fff; font-size: 1.25rem; font-weight: 600; }
            .close-dashboard { cursor: pointer; font-size: 1.5rem; color: #555; }
            .dashboard-tabs { display: flex; padding: 0 24px; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .tab-btn { background: none; border: none; color: #666; padding: 12px 0; cursor: pointer; font-size: 0.9rem; border-bottom: 2px solid transparent; transition: 0.3s; }
            .tab-btn.active { color: #ff6b6b; border-bottom-color: #ff6b6b; }
            .dashboard-body { padding: 24px; max-height: 60vh; overflow-y: auto; }
            .tab-pane { display: none; }
            .tab-pane.active { display: block; }
            .form-group { margin-bottom: 20px; }
            .form-group label { display: block; color: #888; margin-bottom: 8px; font-size: 0.85rem; }
            .form-group input[type="text"] { width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; color: white; box-sizing: border-box; }
            .color-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .f-group label { display: block; color: #888; margin-bottom: 8px; font-size: 0.85rem; }
            .f-group input[type="color"] { width: 100%; height: 40px; background: none; border: 1px solid #333; border-radius: 8px; cursor: pointer; }
            .toggle-row { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
            .toggle-row label { color: #ccc; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; }
            .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .preset-item { height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s; }
            .preset-item:hover { transform: scale(1.02); }
            .preset-item span { color: white; font-weight: 600; font-size: 0.85rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
            .photo-item { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
            .photo-item img { width: 100%; height: 100%; object-fit: cover; }
            .btn-remove-photo { position: absolute; top: 4px; right: 4px; background: #ff4757; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 12px; }
            .add-photo-btn { width: 100%; padding: 12px; background: #1a1a1a; border: 1px dashed #ff6b6b; color: #ff6b6b; border-radius: 12px; cursor: pointer; font-weight: 600; }
            .dashboard-footer { padding: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
            .btn-save { width: 100%; padding: 14px; background: #ff6b6b; color: white; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.3s; }
            .btn-save:hover { background: #ff5252; transform: translateY(-2px); }
            .hidden { display: none; }
        `;
        document.head.appendChild(style);
    }

    toggleDashboard() {
        const modal = document.getElementById('dashboard-modal');
        this.isDashboardVisible = !this.isDashboardVisible;
        if (this.isDashboardVisible) {
            modal.classList.add('active');
            modal.classList.remove('hidden');
            this.renderPhotoList();
        } else {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
    }

    setupEvents() {
        const modal = document.getElementById('dashboard-modal');
        const closeBtn = document.getElementById('close-dashboard-btn');
        if (closeBtn) closeBtn.onclick = () => this.toggleDashboard();

        const tabs = modal.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            };
        });

        const inputs = [
            'in-greet', 'in-quest', 'in-globe',
            'in-clr-globe', 'in-clr-part', 'in-clr-disk', 'in-clr-inner', 'in-clr-outer', 'in-clr-bg',
            'in-tog-heart', 'in-tog-text', 'in-tog-nebula', 'in-tog-grad',
            'in-val-size', 'in-val-pspeed'
        ];

        const heartTog = document.getElementById('in-tog-heart');
        const textTog = document.getElementById('in-tog-text');

        if (heartTog && textTog) {
            heartTog.addEventListener('change', () => {
                if (heartTog.checked) textTog.checked = false;
                this.updateLocalData();
                this.applyDataToScene();
            });
            textTog.addEventListener('change', () => {
                if (textTog.checked) heartTog.checked = false;
                this.updateLocalData();
                this.applyDataToScene();
            });
        }

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.oninput = () => {
                this.updateLocalData();
                this.applyDataToScene();
            };
        });

        document.getElementById('btn-add-photo').onclick = () => document.getElementById('photo-upload').click();
        document.getElementById('photo-upload').onchange = (e) => this.handlePhotoUpload(e);
        document.getElementById('btn-save-final').onclick = () => this.saveToFirebase();
    }

    applyPreset(presetKey) {
        const preset = PRESETS[presetKey];
        if (!preset) return;

        this.userData.globeColor = preset.globeColor;
        this.userData.particleColor = preset.particleColor;
        this.userData.diskColor = preset.diskColor;
        this.userData.innerDiskColor = preset.innerDiskColor;
        this.userData.outermostColor = preset.outermostColor;
        this.userData.backgroundColor = preset.backgroundColor;
        this.userData.isGradient = preset.isGradient;

        const mappings = {
            'in-clr-globe': preset.globeColor,
            'in-clr-part': preset.particleColor,
            'in-clr-disk': preset.diskColor,
            'in-clr-inner': preset.innerDiskColor,
            'in-clr-outer': preset.outermostColor,
            'in-clr-bg': preset.backgroundColor,
            'in-tog-grad': preset.isGradient
        };

        Object.keys(mappings).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') el.checked = mappings[id];
                else el.value = mappings[id];
            }
        });

        this.applyDataToScene();
    }

    updateLocalData() {
        this.userData.greetingText = document.getElementById('in-greet').value;
        this.userData.questionText = document.getElementById('in-quest').value;
        this.userData.globeText = document.getElementById('in-globe').value;
        this.userData.globeColor = document.getElementById('in-clr-globe').value;
        this.userData.particleColor = document.getElementById('in-clr-part').value;
        this.userData.diskColor = document.getElementById('in-clr-disk').value;
        this.userData.innerDiskColor = document.getElementById('in-clr-inner').value;
        this.userData.outermostColor = document.getElementById('in-clr-outer').value;
        this.userData.backgroundColor = document.getElementById('in-clr-bg').value;
        this.userData.centralHeartEnabled = document.getElementById('in-tog-heart').checked;
        this.userData.text3dEnabled = document.getElementById('in-tog-text').checked;
        this.userData.nebulaEnabled = document.getElementById('in-tog-nebula').checked;
        this.userData.isGradient = document.getElementById('in-tog-grad').checked;
        this.userData.size = parseFloat(document.getElementById('in-val-size').value);
        this.userData.particleSpeed = parseFloat(document.getElementById('in-val-pspeed').value);
    }

    renderPhotoList() {
        const list = document.getElementById('photo-grid');
        if (!list) return;
        list.innerHTML = '';
        this.userData.photos.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `<img src="${url}">`;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove-photo';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => this.removePhoto(index);
            item.appendChild(removeBtn);
            list.appendChild(item);
        });
    }

    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (this.userData.photos.length >= 5) {
            alert("Maksimal 5 foto!");
            return;
        }
        const btn = document.getElementById('btn-add-photo');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        btn.disabled = true;
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            this.userData.photos.push(result.secure_url);
            this.renderPhotoList();
            this.applyDataToScene();
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    removePhoto(index) {
        this.userData.photos.splice(index, 1);
        this.renderPhotoList();
        this.applyDataToScene();
    }

    async saveToFirebase() {
        const btn = document.getElementById('btn-save-final');
        btn.textContent = 'Saving Universe...';
        btn.disabled = true;
        try {
            await this.db.collection('user_configs').doc(this.userId).set(this.userData);
            alert('Universe settings saved successfully!');
            this.toggleDashboard();
        } catch (error) {
            alert('Save failed: ' + error.message);
        } finally {
            btn.textContent = 'Save Universe';
            btn.disabled = false;
        }
    }
}

window.dashboard = new Dashboard();
