/**
 * PlayerController.js
 * First-person player controller with flashlight, movement, and interaction
 */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class PlayerController {
    constructor(camera, scene, inventory) {
        this.camera = camera;
        this.scene = scene;
        this.inventory = inventory;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;
        this.isCrouching = false;
        
        // Velocity and direction
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 5.0;
        this.sprintSpeed = 8.0;
        this.crouchSpeed = 2.5;
        
        // Flashlight
        this.flashlight = null;
        this.flashlightOn = true;
        this.batteryLevel = 100;
        this.batteryDrainRate = 2.5; // percent per second
        
        // Controls
        this.controls = new PointerLockControls(camera, document.body);
        this.setupControls();
        
        // Setup flashlight
        this.setupFlashlight();
        
        // Raycaster for interactions
        this.raycaster = new THREE.Raycaster();
        this.interactDistance = 3.0;
        
        // Audio listener
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse click for interaction
        document.addEventListener('mousedown', (event) => {
            if (this.controls.isLocked && event.button === 0) {
                this.interact();
            }
        });
        
        // Right click to toggle flashlight
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (this.controls.isLocked) {
                this.toggleFlashlight();
            }
        });
        
        // F key for flashlight
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyF' && this.controls.isLocked) {
                this.toggleFlashlight();
            }
            
            // R key for rules hint
            if (event.code === 'KeyR') {
                window.game.ui.showRulesHint();
            }
            
            // Escape to pause
            if (event.code === 'Escape' && window.game.isPlaying) {
                if (this.controls.isLocked) {
                    this.controls.unlock();
                } else {
                    window.game.pauseGame();
                }
            }
            
            // E to throw food
            if (event.code === 'KeyE' && this.controls.isLocked) {
                this.throwFood();
            }
        });
        
        // Handle pointer lock state
        this.controls.addEventListener('lock', () => {
            console.log('Controls locked');
        });
        
        this.controls.addEventListener('unlock', () => {
            console.log('Controls unlocked');
            if (window.game.isPlaying && !window.game.isPaused) {
                window.game.pauseGame();
            }
        });
    }
    
    setupFlashlight() {
        // Create flashlight attached to camera
        this.flashlight = new THREE.SpotLight(0xffffee, 1.5, 40, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.target.position.set(0, 0, -1);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        // Add subtle flicker animation
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.flashlight.shadow.camera.near = 0.5;
        this.flashlight.shadow.camera.far = 50;
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump && !this.isCrouching) {
                    this.velocity.y += 5;
                    this.canJump = false;
                }
                break;
            case 'ControlLeft':
            case 'KeyC':
                this.isCrouching = true;
                this.camera.position.y = 1.0;
                break;
            case 'ShiftLeft':
                this.isSprinting = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ControlLeft':
            case 'KeyC':
                this.isCrouching = false;
                this.camera.position.y = 1.7;
                break;
            case 'ShiftLeft':
                this.isSprinting = false;
                break;
        }
    }
    
    toggleFlashlight() {
        this.flashlightOn = !this.flashlightOn;
        this.flashlight.intensity = this.flashlightOn ? 1.5 : 0;
        
        // Play sound
        if (window.game.audio) {
            window.game.audio.playSound('flashlight_click');
        }
    }
    
    throwFood() {
        if (!this.inventory.hasFood()) return;
        
        this.inventory.useFood();
        
        // Create food object at player position
        const foodPosition = new THREE.Vector3();
        this.camera.getWorldDirection(foodPosition);
        foodPosition.multiplyScalar(2);
        foodPosition.add(this.camera.position);
        
        // Trigger monster distraction
        if (window.game.monsterAI) {
            window.game.monsterAI.onFoodThrown(foodPosition);
        }
        
        // Play sound
        if (window.game.audio) {
            window.game.audio.playSound('food_throw');
        }
    }
    
    interact() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Get all interactable objects
        const interactables = this.scene.children.filter(obj => obj.userData.interactable);
        const intersects = this.raycaster.intersectObjects(interactables, true);
        
        if (intersects.length > 0 && intersects[0].distance <= this.interactDistance) {
            const object = intersects[0].object;
            if (object.userData.onInteract) {
                object.userData.onInteract(object);
            }
        }
    }
    
    lockControls() {
        this.controls.unlock();
    }
    
    unlockControls() {
        if (!window.game.isPaused) {
            this.controls.lock();
        }
    }
    
    update(deltaTime) {
        if (!this.controls.isLocked) return;
        
        // Update battery
        if (this.flashlightOn) {
            this.batteryLevel -= this.batteryDrainRate * deltaTime;
            if (this.batteryLevel <= 0) {
                this.batteryLevel = 0;
                this.flashlightOn = false;
                this.flashlight.intensity = 0;
                window.game.ui.updateBatteryLevel(0);
            } else {
                window.game.ui.updateBatteryLevel(Math.floor(this.batteryLevel));
            }
        }
        
        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Calculate movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Determine speed based on state
        let speed = this.moveSpeed;
        if (this.isSprinting && !this.isCrouching) speed = this.sprintSpeed;
        if (this.isCrouching) speed = this.crouchSpeed;
        
        // Apply movement
        if (this.moveForward || this.moveBackward) {
            this.velocity.z = -this.direction.z * speed;
        } else {
            this.velocity.z = 0;
        }
        
        if (this.moveLeft || this.moveRight) {
            this.velocity.x = -this.direction.x * speed;
        } else {
            this.velocity.x = 0;
        }
        
        // Move the player
        this.controls.moveRight(-this.velocity.x * deltaTime);
        this.controls.moveForward(-this.velocity.z * deltaTime);
        
        // Apply vertical velocity (jumping)
        this.camera.position.y += this.velocity.y * deltaTime;
        
        // Ground collision
        if (this.camera.position.y < 1.7) {
            this.velocity.y = 0;
            this.camera.position.y = 1.7;
            this.canJump = true;
        }
        
        // Subtle flashlight flicker for atmosphere
        if (this.flashlightOn && Math.random() < 0.001) {
            this.flashlight.intensity = 1.3 + Math.random() * 0.4;
            setTimeout(() => {
                if (this.flashlightOn) {
                    this.flashlight.intensity = 1.5;
                }
            }, 100);
        }
    }
    
    getPosition() {
        return this.camera.position.clone();
    }
    
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
    
    isFlashlightOn() {
        return this.flashlightOn && this.batteryLevel > 0;
    }
}

export { PlayerController };
