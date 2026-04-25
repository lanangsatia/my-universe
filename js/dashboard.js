/**
 * dashboard.js
 * Handles user dashboard using Firebase Firestore and Storage.
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDzbRlY-OxLJJSp6jJPGqz6MTNzYegBuGk",
    authDomain: "my-universe-ae366.firebaseapp.com",
    projectId: "my-universe-ae366",
    storageBucket: "my-universe-ae366.firebasestorage.app",
    messagingSenderId: "627784339059",
    appId: "1:627784339059:web:3ba09b3b40b2f7d66e2406",
    measurementId: "G-TN805V3TQ5"
};

// Cloudinary Configuration (Please fill these from your Cloudinary Dashboard)
const CLOUDINARY_CLOUD_NAME = "dgszbva8w";
const CLOUDINARY_UPLOAD_PRESET = "my_universe";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

class Dashboard {
    constructor() {
        this.userId = this.getUserIdFromUrl();
        this.userData = null;
        this.isDashboardVisible = false;
        this.db = firebase.firestore();
        // this.storage = firebase.storage(); // Dihentikan karena pindah ke Cloudinary

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

            // HANYA buat tombol & modal jika ID ditemukan di Firestore DAN dalam mode edit
            if (fetchResult.exists && this.isEditMode()) {
                this.createDashboardButton();
                this.createDashboardModal();
            }
        }

        // Sembunyikan loading screen SETELAH data siap
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

            if (doc.exists) {
                return {
                    data: doc.data(),
                    exists: true
                };
            } else {
                // Return default data if ID doesn't exist in Firestore
                return {
                    data: {
                        id: id,
                        greetingText: "Happy Anniversary Bubuyy 😘",
                        questionText: "Do you want to see our memories?",
                        globeText: "To My Beloved",
                        photos: []
                    },
                    exists: false
                };
            }
        } catch (error) {
            console.error('Error fetching data from Firestore:', error);
            return {
                data: {
                    greetingText: "Happy Anniversary Bubuyy 😘",
                    questionText: "Do you want to see our memories?",
                    globeText: "To My Beloved",
                    photos: []
                },
                exists: false
            };
        }
    }

    applyDataToScene() {
        if (!this.userData) return;

        // Apply greeting text
        const greetingTextElement = document.getElementById('greetingText');
        const questionTextElement = document.getElementById('questionText');
        if (greetingTextElement && this.userData.greetingText) {
            greetingTextElement.textContent = this.userData.greetingText;
        }
        if (questionTextElement && this.userData.questionText) {
            questionTextElement.textContent = this.userData.questionText;
        }

        // Apply globe text (HeartText)
        const updateHeartText = () => {
            if (window.heartText && this.userData.globeText) {
                window.heartText.setText(this.userData.globeText);
            }
        };

        if (window.heartText) {
            updateHeartText();
        } else {
            document.addEventListener('hearttext_ready', updateHeartText);
        }

        // Apply photos
        if (this.userData.photos && this.userData.photos.length > 0) {
            window.dispatchEvent(new CustomEvent('update_photos', { detail: this.userData.photos }));
        }
    }

    createDashboardButton() {
        if (document.getElementById('dashboard-toggle-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'dashboard-toggle-btn';
        btn.innerHTML = '<i class="fas fa-cog"></i>';
        btn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.5);
            color: rgb(0, 0, 0);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
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
                    <h2>User Settings</h2>
                    <span class="close-dashboard">&times;</span>
                </div>
                <div class="dashboard-body">
                    <div class="form-group">
                        <label>Greeting Text</label>
                        <input type="text" id="input-greeting-text" value="${this.userData.greetingText || ''}">
                    </div>
                    <div class="form-group">
                        <label>Question Text</label>
                        <input type="text" id="input-question-text" value="${this.userData.questionText || ''}">
                    </div>
                    <div class="form-group">
                        <label>Globe Text (Heart)</label>
                        <textarea id="input-globe-text" rows="3">${this.userData.globeText || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Photos</label>
                        <div id="photo-list" class="photo-grid"></div>
                        <input type="file" id="photo-upload" accept="image/*" style="display:none">
                        <button class="btn-add-photo" id="btn-trigger-upload">
                            <i class="fas fa-plus"></i> Add Photo
                        </button>
                    </div>
                </div>
                <div class="dashboard-footer">
                    <button class="btn-save" id="btn-save-dashboard">Save Changes</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .dashboard-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(5px);
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .dashboard-modal.active {
                opacity: 1;
                pointer-events: auto;
            }
            .dashboard-content {
                background: #1a1a1a;
                width: 90%;
                max-width: 500px;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .dashboard-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .dashboard-header h2 { margin: 0; color: #ff6b6b; font-size: 1.2rem; }
            .close-dashboard { cursor: pointer; font-size: 1.5rem; color: #666; }
            .dashboard-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
            .form-group { margin-bottom: 20px; }
            .form-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 0.9rem; }
            .form-group input, .form-group textarea {
                width: 100%;
                padding: 12px;
                background: #2a2a2a;
                border: 1px solid #333;
                border-radius: 10px;
                color: white;
                font-family: inherit;
                box-sizing: border-box;
            }
            .photo-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 10px;
                margin-bottom: 10px;
            }
            .photo-item {
                position: relative;
                aspect-ratio: 1;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #333;
            }
            .photo-item img { width: 100%; height: 100%; object-fit: cover; }
            .btn-remove-photo {
                position: absolute;
                top: 2px;
                right: 2px;
                background: rgba(255,0,0,0.7);
                color: white;
                border: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 10px;
            }
            .btn-add-photo {
                background: #2a2a2a;
                color: #ff6b6b;
                border: 1px dashed #ff6b6b;
                padding: 10px;
                border-radius: 10px;
                width: 100%;
                cursor: pointer;
            }
            .dashboard-footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
            .btn-save {
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px;
                width: 100%;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s;
            }
            .btn-save:hover { background: #ff5252; }
            .hidden { display: none; }
        `;
        document.head.appendChild(style);

        // Event listeners
        modal.querySelector('.close-dashboard').onclick = () => this.toggleDashboard();
        document.getElementById('btn-save-dashboard').onclick = () => this.saveChanges();
        document.getElementById('btn-trigger-upload').onclick = () => document.getElementById('photo-upload').click();
        document.getElementById('photo-upload').onchange = (e) => this.handlePhotoUpload(e);

        this.renderPhotoList();
    }

    toggleDashboard() {
        const modal = document.getElementById('dashboard-modal');
        this.isDashboardVisible = !this.isDashboardVisible;
        if (this.isDashboardVisible) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('active'), 10);
        } else {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    }

    renderPhotoList() {
        const list = document.getElementById('photo-list');
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

        // LIMIT 5 FOTO
        if (this.userData.photos && this.userData.photos.length >= 5) {
            alert("Maksimal 5 foto saja ya! Hapus foto lama untuk menambah yang baru.");
            return;
        }

        if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" || CLOUDINARY_CLOUD_NAME === "") {
            alert("Harap konfigurasi Cloudinary Cloud Name di js/dashboard.js terlebih dahulu!");
            return;
        }

        const btn = document.getElementById('btn-trigger-upload');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading to Cloudinary...';
        btn.disabled = true;

        try {
            // Persiapkan form data untuk Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', `my_universe/${this.userId}`); // Folder opsional

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const result = await response.json();
            const downloadURL = result.secure_url;

            this.userData.photos.push(downloadURL);
            this.renderPhotoList();
        } catch (error) {
            console.error('Cloudinary upload failed:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    removePhoto(index) {
        if (confirm("Hapus foto ini dari galaksi?")) {
            this.userData.photos.splice(index, 1);
            this.renderPhotoList();
            console.log("Foto dihapus dari daftar. Jangan lupa klik 'Save Changes' untuk menyimpan.");
        }
    }

    async saveChanges() {
        const btn = document.getElementById('btn-save-dashboard');
        const originalText = btn.textContent;
        btn.textContent = 'Saving to Firebase...';
        btn.disabled = true;

        this.userData.greetingText = document.getElementById('input-greeting-text').value;
        this.userData.questionText = document.getElementById('input-question-text').value;
        this.userData.globeText = document.getElementById('input-globe-text').value;

        try {
            await this.db.collection('user_configs').doc(this.userId).set(this.userData);
            this.applyDataToScene();
            alert('Changes saved to Firebase successfully!');
            this.toggleDashboard();
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save changes: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

// Global instance
window.dashboard = new Dashboard();
