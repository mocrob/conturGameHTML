/**
 * GameController.js
 * Main entry point for Night Shift: Museum Protocol
 * Coordinates all game systems and manages game state
 */

import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { MuseumEnvironment } from '../systems/MuseumEnvironment.js';
import { RuleEventEngine } from '../events/RuleEventEngine.js';
import { MonsterAI } from '../ai/MonsterAI.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';
import { PatrolSystem } from '../systems/PatrolSystem.js';

class GameController {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Game Systems
        this.player = null;
        this.environment = null;
        this.ruleEngine = null;
        this.monsterAI = null;
        this.inventory = null;
        this.audio = null;
        this.ui = null;
        this.patrolSystem = null;
        
        // Game State
        this.isPlaying = false;
        this.isPaused = false;
        this.shiftTime = 0; // in seconds (0 = midnight, 21600 = 6 AM)
        this.shiftDuration = 21600; // 6 hours in seconds (scaled for gameplay)
        this.gameSpeed = 1; // Time multiplier
        
        // Bind UI callbacks to window scope
        window.game = this;
    }
    
    async init() {
        // Initialize Three.js renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 0); // Eye level
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        
        // Initialize systems
        this.ui = new UIManager(this);
        this.audio = new AudioManager();
        this.inventory = new InventorySystem(this.ui);
        
        console.log('Night Shift: Museum Protocol initialized');
        console.log('Systems loaded. Ready to start shift.');
    }
    
    async startGame() {
        if (this.isPlaying) return;
        
        // Hide main menu
        document.getElementById('main-menu').classList.add('hidden');
        
        // Reset game state
        this.isPlaying = true;
        this.isPaused = false;
        this.shiftTime = 0;
        this.clock.start();
        
        // Initialize game systems
        this.environment = new MuseumEnvironment(this.scene);
        await this.environment.buildMuseum();
        
        this.player = new PlayerController(this.camera, this.scene, this.inventory);
        this.patrolSystem = new PatrolSystem(this.environment, this.ui);
        this.ruleEngine = new RuleEventEngine(this, this.environment, this.ui);
        this.monsterAI = new MonsterAI(this.scene, this.player, this.environment, this.ui, this.inventory);
        
        // Start patrol route
        this.patrolSystem.generatePatrolRoute();
        this.ui.updateObjective('Begin your patrol. Check all museum halls.');
        
        // Start audio
        this.audio.startAmbience();
        
        // Begin game loop
        this.animate();
        
        console.log('Shift started. Good luck, guard.');
    }
    
    resumeGame() {
        if (!this.isPlaying) return;
        
        this.isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
        this.clock.start();
        this.player.unlockControls();
    }
    
    pauseGame() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.isPaused = true;
        document.getElementById('pause-menu').classList.remove('hidden');
        this.clock.stop();
        this.player.lockControls();
    }
    
    restartGame() {
        this.endGame(false, 'Restarting shift...');
        setTimeout(() => this.startGame(), 500);
    }
    
    quitToMenu() {
        this.endGame(false, 'Returning to menu...');
        setTimeout(() => {
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('victory-screen').classList.add('hidden');
            document.getElementById('pause-menu').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        }, 500);
    }
    
    playAgain() {
        this.endGame(false, 'Starting new shift...');
        setTimeout(() => this.startGame(), 500);
    }
    
    showRules() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('rules-screen').classList.remove('hidden');
    }
    
    hideRules() {
        document.getElementById('rules-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    }
    
    showCredits() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('credits-screen').classList.remove('hidden');
    }
    
    hideCredits() {
        document.getElementById('credits-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    }
    
    endGame(victory, reason) {
        this.isPlaying = false;
        this.isPaused = false;
        this.clock.stop();
        
        if (victory) {
            document.getElementById('victory-message').textContent = reason;
            document.getElementById('victory-screen').classList.remove('hidden');
        } else {
            if (reason) {
                document.getElementById('death-reason').textContent = reason;
            }
            document.getElementById('game-over-screen').classList.remove('hidden');
        }
        
        // Cleanup
        if (this.audio) this.audio.stopAll();
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;
        
        // Update shift time
        this.shiftTime += deltaTime * this.gameSpeed;
        this.ui.updateShiftTime(this.shiftTime);
        
        // Check victory condition (6 AM = 21600 seconds)
        if (this.shiftTime >= this.shiftDuration) {
            this.endGame(true, 'You survived until dawn. The museum releases you... for now.');
            return;
        }
        
        // Update systems
        this.player.update(deltaTime);
        this.ruleEngine.update(deltaTime);
        this.monsterAI.update(deltaTime);
        this.patrolSystem.update(deltaTime);
        
        // Update environment based on time
        this.environment.update(deltaTime, this.shiftTime / this.shiftDuration);
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game on load
const game = new GameController();
window.addEventListener('DOMContentLoaded', () => game.init());

export { GameController };
