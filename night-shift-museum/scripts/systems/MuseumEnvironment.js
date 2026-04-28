/**
 * MuseumEnvironment.js
 * Creates the museum layout with all halls and interactive elements
 */

import * as THREE from 'three';

class MuseumEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.halls = {};
        this.specimenJars = [];
        this.taxidermyAnimals = [];
        this.waxFigures = [];
        this.interactables = [];
        this.lightSources = [];
        this.collisionWalls = [];
    }
    
    async buildMuseum() {
        // Create floor
        this.createFloor();
        
        // Create ceiling
        this.createCeiling();
        
        // Build all halls
        await this.buildEntranceLobby();
        await this.buildSpecimenHall();
        await this.buildTaxidermyHall();
        await this.buildEvolutionHall();
        await this.buildFossilHall();
        await this.buildSecurityOffice();
        await this.buildMaintenanceCorridor();
        
        // Add ambient lighting
        this.setupLighting();
        
        console.log('Museum environment built successfully');
    }
    
    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    createCeiling() {
        const ceilingGeometry = new THREE.PlaneGeometry(200, 200);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 6;
        this.scene.add(ceiling);
    }
    
    createWall(x, z, width, depth, height = 6, material = null) {
        if (!material) {
            material = new THREE.MeshStandardMaterial({
                color: 0x5a4a3a,
                roughness: 0.7,
                metalness: 0.1
            });
        }
        
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x, height / 2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        
        // Add to collision walls
        this.collisionWalls.push({
            position: new THREE.Vector3(x, height / 2, z),
            width: width,
            height: height,
            depth: depth
        });
        
        return wall;
    }
    
    createDoorway(x, z, rotation = 0) {
        const doorwayGroup = new THREE.Group();
        
        // Door frame
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.5,
            metalness: 0.3
        });
        
        // Left frame
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 3.5, 0.2),
            frameMaterial
        );
        leftFrame.position.set(-1.1, 1.75, 0);
        doorwayGroup.add(leftFrame);
        
        // Right frame
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 3.5, 0.2),
            frameMaterial
        );
        rightFrame.position.set(1.1, 1.75, 0);
        doorwayGroup.add(rightFrame);
        
        // Top frame
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.2, 0.2),
            frameMaterial
        );
        topFrame.position.set(0, 3.4, 0);
        doorwayGroup.add(topFrame);
        
        doorwayGroup.rotation.y = rotation;
        doorwayGroup.position.set(x, 0, z);
        this.scene.add(doorwayGroup);
        
        return doorwayGroup;
    }
    
    setupLighting() {
        // Ambient light (very dim for horror atmosphere)
        const ambientLight = new THREE.AmbientLight(0x1a1a2a, 0.15);
        this.scene.add(ambientLight);
        this.lightSources.push(ambientLight);
        
        // Add some dim wall sconces
        const sconcePositions = [
            [10, 3, 10], [-10, 3, 10], [10, 3, -10], [-10, 3, -10],
            [20, 3, 0], [-20, 3, 0], [0, 3, 20], [0, 3, -20]
        ];
        
        sconcePositions.forEach(([x, y, z]) => {
            const sconceLight = new THREE.PointLight(0xffaa00, 0.3, 15);
            sconceLight.position.set(x, y, z);
            sconceLight.castShadow = true;
            this.scene.add(sconceLight);
            this.lightSources.push(sconceLight);
        });
    }
    
    async buildEntranceLobby() {
        const lobbyGroup = new THREE.Group();
        
        // Floor area
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a5a,
            roughness: 0.6,
            metalness: 0.3
        });
        const lobbyFloor = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.1, 20),
            floorMat
        );
        lobbyFloor.position.set(0, 0.05, 0);
        lobbyGroup.add(lobbyFloor);
        
        // Reception desk
        const deskMat = new THREE.MeshStandardMaterial({
            color: 0x3a2a1a,
            roughness: 0.5
        });
        const desk = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1.2, 2),
            deskMat
        );
        desk.position.set(0, 0.6, 8);
        lobbyGroup.add(desk);
        
        // Display cases
        const caseMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.3,
            metalness: 0.5,
            transparent: true,
            opacity: 0.3
        });
        
        [-12, 12].forEach(x => {
            const displayCase = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 1.5),
                caseMat
            );
            displayCase.position.set(x, 1, 5);
            lobbyGroup.add(displayCase);
        });
        
        // Walls
        this.createWall(-15, 0, 1, 20);
        this.createWall(15, 0, 1, 20);
        this.createWall(0, -10, 30, 1);
        this.createWall(0, 10, 30, 1, 6, new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,
            roughness: 0.6
        }));
        
        lobbyGroup.position.set(0, 0, 0);
        this.scene.add(lobbyGroup);
        
        this.halls.entrance = {
            center: new THREE.Vector3(0, 0, 0),
            size: { width: 30, height: 6, depth: 20 },
            connections: ['specimen', 'security']
        };
        
        console.log('Entrance Lobby built');
    }
    
    async buildSpecimenHall() {
        const hallGroup = new THREE.Group();
        
        // Hall floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a4a,
            roughness: 0.7
        });
        const hallFloor = new THREE.Mesh(
            new THREE.BoxGeometry(25, 0.1, 30),
            floorMat
        );
        hallFloor.position.set(-25, 0.05, 0);
        hallGroup.add(hallFloor);
        
        // Specimen jars on shelves
        const jarMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.9,
            transparent: true,
            opacity: 0.5
        });
        
        const specimenPositions = [
            [-28, 1.5, -10], [-28, 1.5, -5], [-28, 1.5, 0], [-28, 1.5, 5], [-28, 1.5, 10],
            [-22, 1.5, -10], [-22, 1.5, -5], [-22, 1.5, 0], [-22, 1.5, 5], [-22, 1.5, 10]
        ];
        
        specimenPositions.forEach(([x, y, z], index) => {
            const jar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16),
                jarMaterial
            );
            jar.position.set(x, y, z);
            jar.userData = {
                interactable: true,
                type: 'specimen_jar',
                id: index,
                isEmpty: false,
                onInteract: (obj) => this.onSpecimenJarInteract(obj)
            };
            hallGroup.add(jar);
            this.specimenJars.push(jar);
            this.interactables.push(jar);
            
            // Shelf
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(8, 0.1, 1),
                new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
            );
            shelf.position.set(-25, 1, z);
            hallGroup.add(shelf);
        });
        
        // Walls
        this.createWall(-37.5, 0, 1, 30);
        this.createWall(-12.5, 0, 1, 30);
        this.createWall(-25, -15, 25, 1);
        this.createWall(-25, 15, 25, 1);
        
        hallGroup.position.set(0, 0, 0);
        this.scene.add(hallGroup);
        
        this.halls.specimen = {
            center: new THREE.Vector3(-25, 0, 0),
            size: { width: 25, height: 6, depth: 30 },
            connections: ['entrance', 'taxidermy', 'fossil']
        };
        
        console.log('Specimen Hall built');
    }
    
    async buildTaxidermyHall() {
        const hallGroup = new THREE.Group();
        
        // Dark wooden floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x2a1a1a,
            roughness: 0.8
        });
        const hallFloor = new THREE.Mesh(
            new THREE.BoxGeometry(25, 0.1, 25),
            floorMat
        );
        hallFloor.position.set(0, 0.05, 25);
        hallGroup.add(hallFloor);
        
        // Taxidermy animals on pedestals
        const animalPositions = [
            [-8, 0, 28], [0, 0, 32], [8, 0, 28],
            [-10, 0, 22], [10, 0, 22]
        ];
        
        animalPositions.forEach(([x, y, z], index) => {
            // Pedestal
            const pedestal = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
            );
            pedestal.position.set(x, 0.75, z);
            hallGroup.add(pedestal);
            
            // Animal placeholder (will be replaced with GLB model)
            const animal = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1.5, 2),
                new THREE.MeshStandardMaterial({ color: 0x4a3a2a })
            );
            animal.position.set(x, 2, z);
            animal.userData = {
                type: 'taxidermy_animal',
                id: index,
                isWatching: false
            };
            hallGroup.add(animal);
            this.taxidermyAnimals.push(animal);
        });
        
        // Warning sign near entrance
        const signGeometry = new THREE.PlaneGeometry(2, 1);
        const signMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide
        });
        const warningSign = new THREE.Mesh(signGeometry, signMaterial);
        warningSign.position.set(-12, 2, 20);
        warningSign.rotation.y = Math.PI / 4;
        hallGroup.add(warningSign);
        
        // Walls
        this.createWall(-12.5, 25, 1, 25);
        this.createWall(12.5, 25, 1, 25);
        this.createWall(0, 12.5, 25, 1);
        this.createWall(0, 37.5, 25, 1);
        
        hallGroup.position.set(0, 0, 0);
        this.scene.add(hallGroup);
        
        this.halls.taxidermy = {
            center: new THREE.Vector3(0, 0, 25),
            size: { width: 25, height: 6, depth: 25 },
            connections: ['specimen', 'evolution'],
            requiresFlashlight: true
        };
        
        console.log('Taxidermy Hall built');
    }
    
    async buildEvolutionHall() {
        const hallGroup = new THREE.Group();
        
        // Stone floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a3a,
            roughness: 0.9
        });
        const hallFloor = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.1, 20),
            floorMat
        );
        hallFloor.position.set(25, 0.05, 25);
        hallGroup.add(hallFloor);
        
        // Wax figures
        const figurePositions = [
            [18, 0, 20], [25, 0, 30], [32, 0, 20],
            [20, 0, 28], [30, 0, 28]
        ];
        
        figurePositions.forEach(([x, y, z], index) => {
            // Base
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 0.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
            );
            base.position.set(x, 0.1, z);
            hallGroup.add(base);
            
            // Wax figure placeholder
            const figure = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.4, 1.6, 4, 8),
                new THREE.MeshStandardMaterial({ 
                    color: 0xd4c4b4,
                    roughness: 0.6
                })
            );
            figure.position.set(x, 1, z);
            figure.userData = {
                type: 'wax_figure',
                id: index,
                isBreathing: false,
                originalY: 1
            };
            hallGroup.add(figure);
            this.waxFigures.push(figure);
        });
        
        // Evolution timeline displays
        for (let i = 0; i < 5; i++) {
            const display = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 0.2),
                new THREE.MeshStandardMaterial({ color: 0x3a3a2a })
            );
            display.position.set(15 + i * 5, 1.5, 18);
            hallGroup.add(display);
        }
        
        // Walls
        this.createWall(12.5, 25, 1, 20);
        this.createWall(37.5, 25, 1, 20);
        this.createWall(25, 15, 30, 1);
        this.createWall(25, 35, 30, 1);
        
        hallGroup.position.set(0, 0, 0);
        this.scene.add(hallGroup);
        
        this.halls.evolution = {
            center: new THREE.Vector3(25, 0, 25),
            size: { width: 30, height: 6, depth: 20 },
            connections: ['taxidermy', 'fossil'],
            hasWaxFigures: true
        };
        
        console.log('Evolution Hall built');
    }
    
    async buildFossilHall() {
        const hallGroup = new THREE.Group();
        
        // Ancient stone floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x5a5a4a,
            roughness: 1.0
        });
        const hallFloor = new THREE.Mesh(
            new THREE.BoxGeometry(35, 0.1, 25),
            floorMat
        );
        hallFloor.position.set(25, 0.05, -10);
        hallGroup.add(hallFloor);
        
        // Fossil displays
        const fossilPositions = [
            [20, 0, -5], [30, 0, -5], [25, 0, -15],
            [15, 0, -10], [35, 0, -10]
        ];
        
        fossilPositions.forEach(([x, y, z]) => {
            // Fossil skeleton placeholder
            const fossil = new THREE.Group();
            
            // Spine
            for (let i = 0; i < 8; i++) {
                const vertebra = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 8, 8),
                    new THREE.MeshStandardMaterial({ color: 0xc4b4a4 })
                );
                vertebra.position.set(0, 0.3 + i * 0.4, 0);
                fossil.add(vertebra);
            }
            
            // Skull
            const skull = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xc4b4a4 })
            );
            skull.position.set(0, 3.5, 0.3);
            fossil.add(skull);
            
            fossil.position.set(x, 0, z);
            fossil.scale.set(1.5, 1.5, 1.5);
            hallGroup.add(fossil);
        });
        
        // Large dinosaur skeleton in center
        const dinoSkeleton = new THREE.Group();
        for (let i = 0; i < 15; i++) {
            const bone = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.2, 0.8, 4, 8),
                new THREE.MeshStandardMaterial({ color: 0xd4c4b4 })
            );
            bone.rotation.z = Math.PI / 2;
            bone.position.set(0, 0.5 + i * 0.6, 0);
            dinoSkeleton.add(bone);
        }
        dinoSkeleton.position.set(25, 0, -10);
        dinoSkeleton.scale.set(2, 2, 2);
        dinoSkeleton.rotation.y = Math.PI / 4;
        hallGroup.add(dinoSkeleton);
        
        // Walls
        this.createWall(7.5, -10, 1, 25);
        this.createWall(42.5, -10, 1, 25);
        this.createWall(25, -22.5, 35, 1);
        this.createWall(25, 2.5, 35, 1);
        
        hallGroup.position.set(0, 0, 0);
        this.scene.add(hallGroup);
        
        this.halls.fossil = {
            center: new THREE.Vector3(25, 0, -10),
            size: { width: 35, height: 8, depth: 25 },
            connections: ['specimen', 'evolution', 'maintenance'],
            safeZone: true // Rule 5: Can turn around here
        };
        
        console.log('Fossil Hall built');
    }
    
    async buildSecurityOffice() {
        const officeGroup = new THREE.Group();
        
        // Office floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.7
        });
        const officeFloor = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.1, 12),
            floorMat
        );
        officeFloor.position.set(0, 0.05, -15);
        officeGroup.add(officeFloor);
        
        // Security desk with monitors
        const deskMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.5,
            metalness: 0.3
        });
        const desk = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.8, 2),
            deskMat
        );
        desk.position.set(0, 0.4, -12);
        officeGroup.add(desk);
        
        // Monitor screens
        const monitorMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        
        [-1, 0, 1].forEach((xOffset, i) => {
            const monitor = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 0.1),
                monitorMat
            );
            monitor.position.set(xOffset, 1.2, -12);
            officeGroup.add(monitor);
            
            // Monitor light
            const monitorLight = new THREE.PointLight(0x00ff00, 0.2, 3);
            monitorLight.position.set(xOffset, 1.2, -11.5);
            officeGroup.add(monitorLight);
        });
        
        // Chair
        const chair = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        chair.position.set(0, 0.4, -10);
        officeGroup.add(chair);
        
        // Locker
        const locker = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.5, 0.8),
            new THREE.MeshStandardMaterial({ 
                color: 0x4a5a4a,
                metalness: 0.5,
                roughness: 0.3
            })
        );
        locker.position.set(6, 1.25, -14);
        officeGroup.add(locker);
        
        // Walls
        this.createWall(-7.5, -15, 1, 12);
        this.createWall(7.5, -15, 1, 12);
        this.createWall(0, -21, 15, 1);
        this.createWall(0, -9, 15, 1, 6, new THREE.MeshStandardMaterial({
            color: 0x3a3a4a,
            roughness: 0.6
        }));
        
        // Door to entrance
        this.createDoorway(0, -9);
        
        officeGroup.position.set(0, 0, 0);
        this.scene.add(officeGroup);
        
        this.halls.security = {
            center: new THREE.Vector3(0, 0, -15),
            size: { width: 15, height: 6, depth: 12 },
            connections: ['entrance'],
            isStartZone: true
        };
        
        console.log('Security Office built');
    }
    
    async buildMaintenanceCorridor() {
        const corridorGroup = new THREE.Group();
        
        // Grimy floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 1.0
        });
        const corridorFloor = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.1, 40),
            floorMat
        );
        corridorFloor.position.set(50, 0.05, -10);
        corridorGroup.add(corridorFloor);
        
        // Pipes along walls
        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            metalness: 0.7,
            roughness: 0.4
        });
        
        for (let z = -30; z < 10; z += 5) {
            const pipe1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 1, 8),
                pipeMat
            );
            pipe1.rotation.z = Math.PI / 2;
            pipe1.position.set(46, 2, z);
            corridorGroup.add(pipe1);
            
            const pipe2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
                pipeMat
            );
            pipe2.rotation.z = Math.PI / 2;
            pipe2.position.set(54, 2.5, z);
            corridorGroup.add(pipe2);
        }
        
        // Flickering lights
        for (let z = -25; z < 5; z += 10) {
            const bulbLight = new THREE.PointLight(0xffaa00, 0.3, 8);
            bulbLight.position.set(50, 3, z);
            bulbLight.userData = { flicker: true, baseIntensity: 0.3 };
            corridorGroup.add(bulbLight);
            this.lightSources.push(bulbLight);
        }
        
        // Walls
        this.createWall(46, -10, 1, 40, 4);
        this.createWall(54, -10, 1, 40, 4);
        this.createWall(50, -30, 8, 1, 4);
        this.createWall(50, 10, 8, 1, 4);
        
        corridorGroup.position.set(0, 0, 0);
        this.scene.add(corridorGroup);
        
        this.halls.maintenance = {
            center: new THREE.Vector3(50, 0, -10),
            size: { width: 8, height: 4, depth: 40 },
            connections: ['fossil'],
            isHidden: true,
            hasFlickeringLights: true
        };
        
        console.log('Maintenance Corridor built');
    }
    
    onSpecimenJarInteract(jar) {
        if (jar.userData.isEmpty) {
            // Return creature
            jar.userData.isEmpty = false;
            jar.material.opacity = 0.5;
            jar.material.color.setHex(0x88ccff);
            
            if (window.game.ruleEngine) {
                window.game.ruleEngine.onCreatureReturned();
            }
            
            window.game.ui.updateObjective('Creature returned. Continue patrol.');
            
            if (window.game.audio) {
                window.game.audio.playSound('jar_close');
            }
        } else {
            // Check contents
            window.game.ui.updateObjective('Specimen jar contains preserved specimen.');
        }
    }
    
    triggerEmptySpecimenJar() {
        // Find a random jar to empty
        const availableJars = this.specimenJars.filter(j => !j.userData.isEmpty);
        if (availableJars.length === 0) return null;
        
        const jar = availableJars[Math.floor(Math.random() * availableJars.length)];
        jar.userData.isEmpty = true;
        jar.material.opacity = 0.2;
        jar.material.color.setHex(0x444444);
        
        return jar;
    }
    
    animateWaxFigure(figure) {
        // Subtle breathing animation
        const time = Date.now() * 0.001;
        figure.position.y = figure.userData.originalY + Math.sin(time * 2) * 0.05;
        figure.userData.isBreathing = true;
    }
    
    update(deltaTime, timeProgress) {
        // Animate flickering lights
        this.lightSources.forEach(light => {
            if (light.userData.flicker) {
                if (Math.random() < 0.05) {
                    light.intensity = light.userData.baseIntensity * (0.5 + Math.random());
                }
            }
        });
        
        // Update wax figures
        this.waxFigures.forEach(figure => {
            if (figure.userData.isBreathing) {
                this.animateWaxFigure(figure);
            }
        });
    }
    
    getHallByName(name) {
        return this.halls[name];
    }
    
    getPlayerHall(position) {
        // Determine which hall the player is in based on position
        for (const [hallName, hallData] of Object.entries(this.halls)) {
            const dx = Math.abs(position.x - hallData.center.x);
            const dz = Math.abs(position.z - hallData.center.z);
            
            if (dx < hallData.size.width / 2 && dz < hallData.size.depth / 2) {
                return hallName;
            }
        }
        
        return 'entrance'; // Default
    }
}

export { MuseumEnvironment };
