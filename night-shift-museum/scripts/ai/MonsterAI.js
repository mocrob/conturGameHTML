/**
 * MonsterAI.js
 * Advanced AI system for monsters with finite state machines
 */

import * as THREE from 'three';

class MonsterAI {
    constructor(scene, player, environment, ui, inventory) {
        this.scene = scene;
        this.player = player;
        this.environment = environment;
        this.ui = ui;
        this.inventory = inventory;
        
        // Monster instances
        this.monsters = [];
        this.hunters = [];
        
        // AI States
        this.STATES = {
            IDLE: 'idle',
            PATROL: 'patrol',
            STALK: 'stalk',
            HUNT: 'hunt',
            CHASE: 'chase',
            RETREAT: 'retreat',
            DISTRACTED: 'distracted'
        };
        
        // Perception settings
        this.detectionRange = 25;
        this.fieldOfView = Math.PI * 1.5; // 270 degrees
        this.lightSensitivity = 0.8;
        
        // Create initial monsters
        this.createMonsters();
        
        console.log('Monster AI system initialized');
    }
    
    createMonsters() {
        // Monster Type 1: Specimen Creature (fast, stealthy)
        this.createMonster({
            id: 'specimen_1',
            type: 'specimen_creature',
            position: new THREE.Vector3(-30, 0, 0),
            speed: 6,
            detectionRange: 20,
            aggression: 0.7,
            modelColor: 0x4a6a4a,
            scale: 1.0
        });
        
        // Monster Type 2: Shadow Stalker (slow, terrifying)
        this.createMonster({
            id: 'shadow_1',
            type: 'shadow_stalker',
            position: new THREE.Vector3(40, 0, -15),
            speed: 3,
            detectionRange: 30,
            aggression: 0.9,
            modelColor: 0x1a1a1a,
            scale: 1.3
        });
    }
    
    createMonster(config) {
        const monsterGroup = new THREE.Group();
        
        // Body placeholder (will be replaced with GLB model)
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: config.modelColor,
            roughness: 0.8,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        monsterGroup.add(body);
        
        // Eyes (glowing)
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.8, 0.3);
        monsterGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.8, 0.3);
        monsterGroup.add(rightEye);
        
        // Set initial position
        monsterGroup.position.copy(config.position);
        
        // Add to scene
        this.scene.add(monsterGroup);
        
        // Create monster object
        const monster = {
            ...config,
            mesh: monsterGroup,
            currentState: this.STATES.PATROL,
            targetPosition: config.position.clone(),
            patrolPoints: this.generatePatrolPoints(config.position),
            currentPatrolIndex: 0,
            lastKnownPlayerPos: null,
            visibility: 0.3, // Start partially hidden
            isDistracted: false,
            distractionTimer: 0,
            canSeePlayer: false
        };
        
        this.monsters.push(monster);
        
        console.log(`Created monster: ${config.id} (${config.type})`);
    }
    
    generatePatrolPoints(centerPos) {
        // Generate patrol points around the monster's starting area
        const points = [];
        const range = 15;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = centerPos.x + Math.cos(angle) * range;
            const z = centerPos.z + Math.sin(angle) * range;
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        return points;
    }
    
    spawnHunter(type) {
        // Spawn a hunting monster at a random location
        const spawnPoints = [
            new THREE.Vector3(-30, 0, 15),
            new THREE.Vector3(35, 0, -20),
            new THREE.Vector3(0, 0, 35),
            new THREE.Vector3(-20, 0, -20)
        ];
        
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
        this.createMonster({
            id: `hunter_${Date.now()}`,
            type: type,
            position: spawnPoint,
            speed: type === 'specimen_creature' ? 7 : 4,
            detectionRange: 35,
            aggression: 1.0,
            modelColor: type === 'specimen_creature' ? 0x6a4a4a : 0x0a0a0a,
            scale: 1.2
        });
        
        // Set all monsters to hunt mode
        this.monsters.forEach(monster => {
            if (monster.type === type) {
                monster.currentState = this.STATES.HUNT;
                monster.aggression = 1.0;
            }
        });
        
        this.ui.showWarning('HUNTING CREATURE RELEASED!', 3000);
    }
    
    update(deltaTime) {
        if (!this.player) return;
        
        const playerPos = this.player.getPosition();
        const playerDir = this.player.getDirection();
        const flashlightOn = this.player.isFlashlightOn();
        
        this.monsters.forEach(monster => {
            this.updateMonsterPerception(monster, playerPos, playerDir, flashlightOn);
            this.updateMonsterState(monster, deltaTime, playerPos);
            this.updateMonsterBehavior(monster, deltaTime);
        });
        
        // Clean up dead/removed monsters
        this.monsters = this.monsters.filter(m => m.mesh.parent !== null);
    }
    
    updateMonsterPerception(monster, playerPos, playerDir, flashlightOn) {
        const monsterPos = monster.mesh.position;
        const toPlayer = new THREE.Vector3().subVectors(playerPos, monsterPos);
        const distance = toPlayer.length();
        
        // Check if monster can see player
        monster.canSeePlayer = false;
        
        if (distance < monster.detectionRange) {
            // Check field of view
            const toPlayerNorm = toPlayer.clone().normalize();
            const monsterDir = new THREE.Vector3(0, 0, 1);
            monster.mesh.getWorldDirection(monsterDir);
            
            const angle = monsterDir.angleTo(toPlayerNorm);
            
            if (angle < this.fieldOfView / 2) {
                // Player is in FOV - check line of sight
                const raycaster = new THREE.Raycaster();
                raycaster.set(monsterPos, toPlayerNorm);
                
                // Simple LOS check (would need proper collision in production)
                monster.canSeePlayer = true;
                
                // Flashlight affects visibility
                if (flashlightOn) {
                    // If player is looking at monster, it may retreat
                    const playerToMonster = new THREE.Vector3().subVectors(monsterPos, playerPos).normalize();
                    const lookAngle = playerDir.angleTo(playerToMonster);
                    
                    if (lookAngle < 0.5 && distance < 15) {
                        // Player is looking directly at monster
                        monster.visibility = Math.min(monster.visibility + 0.01, 1.0);
                    } else {
                        monster.visibility = Math.max(monster.visibility - 0.005, 0.2);
                    }
                }
            }
        }
        
        // Update last known position
        if (monster.canSeePlayer) {
            monster.lastKnownPlayerPos = playerPos.clone();
        }
    }
    
    updateMonsterState(monster, deltaTime, playerPos) {
        const prevState = monster.currentState;
        
        switch (monster.currentState) {
            case this.STATES.IDLE:
                if (monster.canSeePlayer) {
                    monster.currentState = monster.aggression > 0.8 
                        ? this.STATES.CHASE 
                        : this.STATES.STALK;
                }
                break;
                
            case this.STATES.PATROL:
                if (monster.canSeePlayer) {
                    monster.currentState = monster.aggression > 0.8 
                        ? this.STATES.CHASE 
                        : this.STATES.STALK;
                } else if (monster.isDistracted) {
                    monster.currentState = this.STATES.DISTRACTED;
                }
                break;
                
            case this.STATES.STALK:
                if (!monster.canSeePlayer) {
                    monster.currentState = this.STATES.PATROL;
                } else {
                    const dist = monster.mesh.position.distanceTo(playerPos);
                    if (dist < 5) {
                        monster.currentState = this.STATES.CHASE;
                    }
                }
                break;
                
            case this.STATES.HUNT:
                if (monster.lastKnownPlayerPos) {
                    monster.targetPosition.copy(monster.lastKnownPlayerPos);
                }
                if (monster.canSeePlayer) {
                    monster.currentState = this.STATES.CHASE;
                }
                break;
                
            case this.STATES.CHASE:
                if (!monster.canSeePlayer) {
                    monster.currentState = this.STATES.HUNT;
                }
                break;
                
            case this.STATES.DISTRACTED:
                monster.distractionTimer -= deltaTime;
                if (monster.distractionTimer <= 0) {
                    monster.isDistracted = false;
                    monster.currentState = this.STATES.PATROL;
                }
                break;
        }
        
        if (prevState !== monster.currentState) {
            console.log(`${monster.id} state change: ${prevState} -> ${monster.currentState}`);
        }
    }
    
    updateMonsterBehavior(monster, deltaTime) {
        const speed = monster.speed * deltaTime;
        const monsterPos = monster.mesh.position;
        
        switch (monster.currentState) {
            case this.STATES.IDLE:
                // Minimal movement
                this.idleAnimation(monster, deltaTime);
                break;
                
            case this.STATES.PATROL:
                this.patrolBehavior(monster, speed);
                break;
                
            case this.STATES.STALK:
                this.stalkBehavior(monster, speed);
                break;
                
            case this.STATES.HUNT:
                this.huntBehavior(monster, speed);
                break;
                
            case this.STATES.CHASE:
                this.chaseBehavior(monster, speed);
                break;
                
            case this.STATES.DISTRACTED:
                this.distractedBehavior(monster, speed);
                break;
        }
        
        // Update mesh visibility based on state
        monster.mesh.children.forEach(child => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = monster.visibility;
            }
        });
    }
    
    idleAnimation(monster, deltaTime) {
        // Subtle breathing/swaying motion
        const time = Date.now() * 0.001;
        monster.mesh.position.y = Math.sin(time * 2) * 0.05;
        monster.mesh.rotation.y = Math.sin(time * 0.5) * 0.1;
    }
    
    patrolBehavior(monster, speed) {
        const target = monster.patrolPoints[monster.currentPatrolIndex];
        const direction = new THREE.Vector3().subVectors(target, monster.mesh.position);
        const distance = direction.length();
        
        if (distance < 1) {
            // Reached patrol point, move to next
            monster.currentPatrolIndex = (monster.currentPatrolIndex + 1) % monster.patrolPoints.length;
        } else {
            direction.normalize();
            monster.mesh.position.add(direction.multiplyScalar(speed));
            monster.mesh.lookAt(target);
        }
    }
    
    stalkBehavior(monster, speed) {
        if (!this.player) return;
        
        const playerPos = this.player.getPosition();
        const direction = new THREE.Vector3().subVectors(playerPos, monster.mesh.position);
        const distance = direction.length();
        
        // Maintain distance while stalking
        const idealDistance = 10;
        
        if (distance > idealDistance + 2) {
            direction.normalize();
            monster.mesh.position.add(direction.multiplyScalar(speed * 0.5));
            monster.mesh.lookAt(playerPos);
        } else if (distance < idealDistance - 2) {
            // Back away
            direction.normalize();
            monster.mesh.position.sub(direction.multiplyScalar(speed * 0.3));
            monster.mesh.lookAt(playerPos);
        }
        
        // Hide behind objects when possible
        monster.visibility = Math.max(monster.visibility - 0.001, 0.2);
    }
    
    huntBehavior(monster, speed) {
        if (monster.lastKnownPlayerPos) {
            const direction = new THREE.Vector3().subVectors(
                monster.lastKnownPlayerPos, 
                monster.mesh.position
            );
            const distance = direction.length();
            
            if (distance < 1) {
                // Arrived at last known position, switch to search pattern
                monster.currentState = this.STATES.PATROL;
            } else {
                direction.normalize();
                monster.mesh.position.add(direction.multiplyScalar(speed));
                monster.mesh.lookAt(monster.lastKnownPlayerPos);
            }
        } else {
            monster.currentState = this.STATES.PATROL;
        }
    }
    
    chaseBehavior(monster, speed) {
        if (!this.player) return;
        
        const playerPos = this.player.getPosition();
        const direction = new THREE.Vector3().subVectors(playerPos, monster.mesh.position);
        const distance = direction.length();
        
        if (distance < 2) {
            // Caught the player!
            this.catchPlayer(monster);
        } else {
            direction.normalize();
            monster.mesh.position.add(direction.multiplyScalar(speed * 1.2));
            monster.mesh.lookAt(playerPos);
            
            // Show warning when close
            if (distance < 10) {
                this.ui.updateMonsterWarning(distance);
            }
        }
    }
    
    distractedBehavior(monster, speed) {
        if (!this.foodPosition) {
            monster.currentState = this.STATES.PATROL;
            return;
        }
        
        const direction = new THREE.Vector3().subVectors(
            this.foodPosition, 
            monster.mesh.position
        );
        const distance = direction.length();
        
        if (distance < 2) {
            // Found the food, eat it
            monster.isDistracted = false;
            monster.distractionTimer = 5; // Stay here for 5 seconds
        } else {
            direction.normalize();
            monster.mesh.position.add(direction.multiplyScalar(speed));
            monster.mesh.lookAt(this.foodPosition);
        }
    }
    
    onFoodThrown(position) {
        this.foodPosition = position.clone();
        
        // Alert nearby monsters
        this.monsters.forEach(monster => {
            const distance = monster.mesh.position.distanceTo(position);
            if (distance < 20) {
                monster.isDistracted = true;
                monster.distractionTimer = 10;
                monster.currentState = this.STATES.DISTRACTED;
            }
        });
        
        // Remove food after some time
        setTimeout(() => {
            this.foodPosition = null;
        }, 10000);
    }
    
    catchPlayer(monster) {
        if (!window.game.isPlaying) return;
        
        this.ui.showBloodOverlay(0.8);
        
        const deathMessages = [
            'The museum claims another victim...',
            `${monster.type} caught you in the darkness`,
            'Your shift ended prematurely...',
            'The previous guard joins you...',
            'Protocol failed. You are terminated.'
        ];
        
        const message = deathMessages[Math.floor(Math.random() * deathMessages.length)];
        window.game.endGame(false, message);
    }
    
    getMonsterDistance() {
        if (!this.player) return Infinity;
        
        const playerPos = this.player.getPosition();
        let closest = Infinity;
        
        this.monsters.forEach(monster => {
            const dist = monster.mesh.position.distanceTo(playerPos);
            if (dist < closest) {
                closest = dist;
            }
        });
        
        return closest;
    }
    
    cleanup() {
        this.monsters.forEach(monster => {
            this.scene.remove(monster.mesh);
        });
        this.monsters = [];
    }
}

export { MonsterAI };
