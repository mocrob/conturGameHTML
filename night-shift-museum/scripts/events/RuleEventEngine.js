/**
 * RuleEventEngine.js
 * Modular event system for rule-based encounters with weighted randomness
 */

class RuleEventEngine {
    constructor(gameController, environment, ui) {
        this.game = gameController;
        this.environment = environment;
        this.ui = ui;
        
        // Event state tracking
        this.activeEvents = new Map();
        this.eventCooldowns = new Map();
        this.difficultyMultiplier = 1.0;
        
        // Rule 1: Empty specimen jar tracking
        this.emptyJarActive = false;
        this.emptyJarTimer = 0;
        this.emptyJarDuration = 240; // 4 minutes in seconds
        
        // Rule 3: Wax figure breathing
        this.waxFigureActive = false;
        this.waxFigureCooldown = 0;
        this.waxFigureDuration = 30; // 30 minutes before patrol resumes
        
        // Rule 5: Being followed
        this.followedActive = false;
        this.followedTimer = 0;
        this.lastPlayerHall = 'entrance';
        
        // Event definitions with weights
        this.eventDefinitions = [
            {
                id: 'empty_specimen_jar',
                weight: 15,
                minTime: 60,
                cooldown: 600,
                trigger: () => this.triggerEmptyJar(),
                update: (dt) => this.updateEmptyJar(dt)
            },
            {
                id: 'wax_figure_breathing',
                weight: 10,
                minTime: 120,
                cooldown: 900,
                trigger: () => this.triggerWaxFigure(),
                update: (dt) => this.updateWaxFigure(dt)
            },
            {
                id: 'being_followed',
                weight: 20,
                minTime: 180,
                cooldown: 480,
                trigger: () => this.triggerBeingFollowed(),
                update: (dt) => this.updateBeingFollowed(dt)
            },
            {
                id: 'power_flicker',
                weight: 25,
                minTime: 30,
                cooldown: 300,
                trigger: () => this.triggerPowerFlicker(),
                update: (dt) => this.updatePowerFlicker(dt)
            },
            {
                id: 'distant_footsteps',
                weight: 30,
                minTime: 20,
                cooldown: 180,
                trigger: () => this.triggerDistantFootsteps(),
                update: (dt) => this.updateDistantFootsteps(dt)
            }
        ];
        
        this.timeSinceLastEvent = 0;
        
        console.log('Rule Event Engine initialized');
    }
    
    update(deltaTime) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        this.timeSinceLastEvent += deltaTime;
        
        // Update active events
        this.activeEvents.forEach((event, eventId) => {
            if (event.update) {
                event.update(deltaTime);
            }
        });
        
        // Update cooldowns
        this.eventCooldowns.forEach((remaining, eventId) => {
            this.eventCooldowns.set(eventId, remaining - deltaTime);
            if (remaining <= 0) {
                this.eventCooldowns.delete(eventId);
            }
        });
        
        // Try to trigger new events
        this.tryTriggerEvent(deltaTime);
        
        // Increase difficulty over time
        this.difficultyMultiplier = 1.0 + (this.game.shiftTime / this.game.shiftDuration) * 0.5;
    }
    
    tryTriggerEvent(deltaTime) {
        // Check minimum time between events
        if (this.timeSinceLastEvent < 30) return;
        
        // Get available events (not on cooldown)
        const availableEvents = this.eventDefinitions.filter(event => {
            const cooldown = this.eventCooldowns.get(event.id);
            return !cooldown || cooldown <= 0;
        });
        
        if (availableEvents.length === 0) return;
        
        // Calculate total weight
        const totalWeight = availableEvents.reduce((sum, event) => {
            return sum + event.weight * this.difficultyMultiplier;
        }, 0);
        
        // Random selection based on weight
        let random = Math.random() * totalWeight;
        let selectedEvent = null;
        
        for (const event of availableEvents) {
            random -= event.weight * this.difficultyMultiplier;
            if (random <= 0) {
                selectedEvent = event;
                break;
            }
        }
        
        if (!selectedEvent) {
            selectedEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        }
        
        // Trigger the event
        this.triggerEvent(selectedEvent);
        this.timeSinceLastEvent = 0;
    }
    
    triggerEvent(eventDef) {
        console.log(`Triggering event: ${eventDef.id}`);
        
        try {
            const eventData = eventDef.trigger();
            if (eventData !== false) {
                this.activeEvents.set(eventDef.id, {
                    ...eventData,
                    update: eventDef.update
                });
                this.eventCooldowns.set(eventDef.id, eventDef.cooldown);
            }
        } catch (e) {
            console.error(`Error triggering event ${eventDef.id}:`, e);
        }
    }
    
    // ==================== RULE 1: EMPTY SPECIMEN JAR ====================
    
    triggerEmptyJar() {
        if (this.emptyJarActive) return false;
        
        const jar = this.environment.triggerEmptySpecimenJar();
        if (!jar) return false;
        
        this.emptyJarActive = true;
        this.emptyJarTimer = this.emptyJarDuration;
        
        this.ui.updateObjective('⚠️ RULE 1: Specimen jar is EMPTY! Find the creature and return it within 4 minutes!');
        this.ui.showWarning('SPECIMEN ESCAPED - 4:00 REMAINING', 3000);
        
        if (this.game.audio) {
            this.game.audio.playProceduralSound('monster_nearby');
        }
        
        return {
            jar: jar,
            startTime: Date.now()
        };
    }
    
    updateEmptyJar(dt) {
        if (!this.emptyJarActive) return;
        
        this.emptyJarTimer -= dt;
        
        // Update timer display
        const minutes = Math.floor(this.emptyJarTimer / 60);
        const seconds = Math.floor(this.emptyJarTimer % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.emptyJarTimer <= 60) {
            this.ui.updateObjective(`⚠️ CRITICAL: ${timeString} remaining before creature becomes HUNTING!`);
        }
        
        // When time runs out, spawn hunting monster
        if (this.emptyJarTimer <= 0) {
            this.emptyJarActive = false;
            this.ui.showWarning('CREATURE IS NOW HUNTING!', 3000);
            
            if (this.game.monsterAI) {
                this.game.monsterAI.spawnHunter('specimen_creature');
            }
        }
    }
    
    onCreatureReturned() {
        this.emptyJarActive = false;
        this.emptyJarTimer = 0;
        this.ui.updateObjective('Creature contained. Continue patrol.');
        
        if (this.game.audio) {
            this.game.audio.playProceduralSound('jar_close');
        }
    }
    
    // ==================== RULE 3: WAX FIGURE BREATHING ====================
    
    triggerWaxFigure() {
        if (this.waxFigureActive) return false;
        
        // Check if player is in evolution hall
        if (!this.game.player) return false;
        
        const playerPos = this.game.player.getPosition();
        const currentHall = this.environment.getPlayerHall(playerPos);
        
        if (currentHall !== 'evolution') return false;
        
        this.waxFigureActive = true;
        
        // Animate wax figures
        const figures = this.environment.waxFigures;
        const randomFigure = figures[Math.floor(Math.random() * figures.length)];
        randomFigure.userData.isBreathing = true;
        
        this.ui.updateObjective('⚠️ RULE 3: Wax figure is BREATHING! Leave without breaking eye contact!');
        this.ui.showWarning('DON\'T LOOK AWAY - BACK AWAY SLOWLY', 3000);
        
        if (this.game.audio) {
            this.game.audio.playProceduralSound('breathing');
        }
        
        return {
            figure: randomFigure,
            startTime: Date.now()
        };
    }
    
    updateWaxFigure(dt) {
        if (!this.waxFigureActive) return;
        
        // Check if player has left evolution hall
        if (!this.game.player) return;
        
        const playerPos = this.game.player.getPosition();
        const currentHall = this.environment.getPlayerHall(playerPos);
        
        if (currentHall !== 'evolution') {
            // Player has left - start 30 minute cooldown
            this.waxFigureActive = false;
            this.waxFigureCooldown = this.waxFigureDuration * 60; // Convert to seconds
            
            this.ui.updateObjective('You escaped safely. Wait 30 minutes before returning to Evolution Hall.');
            
            if (this.game.environment) {
                this.environment.waxFigures.forEach(fig => {
                    fig.userData.isBreathing = false;
                });
            }
        }
    }
    
    // ==================== RULE 5: BEING FOLLOWED ====================
    
    triggerBeingFollowed() {
        if (this.followedActive) return false;
        
        // Only trigger when moving between halls
        if (!this.game.player) return false;
        
        const playerPos = this.game.player.getPosition();
        const currentHall = this.environment.getPlayerHall(playerPos);
        
        // Don't trigger in safe zones
        const hallData = this.environment.halls[currentHall];
        if (hallData && hallData.safeZone) return false;
        
        this.followedActive = true;
        this.followedTimer = 0;
        this.lastPlayerHall = currentHall;
        
        this.ui.updateObjective('⚠️ RULE 5: You feel someone behind you. DO NOT TURN AROUND until you reach Fossil Hall.');
        
        if (this.game.audio) {
            this.game.audio.playProceduralSound('distant_footstep');
            setTimeout(() => {
                if (this.followedActive && this.game.audio) {
                    this.game.audio.playProceduralSound('footstep');
                }
            }, 2000);
        }
        
        return {
            startHall: currentHall
        };
    }
    
    updateBeingFollowed(dt) {
        if (!this.followedActive) return;
        
        if (!this.game.player) return;
        
        const playerPos = this.game.player.getPosition();
        const currentHall = this.environment.getPlayerHall(playerPos);
        
        // Check if player reached fossil hall (safe zone)
        if (currentHall === 'fossil') {
            this.followedActive = false;
            this.ui.updateObjective('You made it to the Fossil Hall. Whatever was behind you is gone... for now.');
            
            if (this.game.audio) {
                this.game.audio.playProceduralSound('creak');
            }
        }
        
        // Periodic footsteps
        this.followedTimer += dt;
        if (this.followedTimer > 5 && Math.random() < 0.3) {
            if (this.game.audio) {
                this.game.audio.playProceduralSound('footstep');
            }
            this.followedTimer = 0;
        }
    }
    
    // ==================== ATMOSPHERIC EVENTS ====================
    
    triggerPowerFlicker() {
        // Flicker lights randomly
        const lights = this.environment.lightSources;
        
        lights.forEach(light => {
            if (Math.random() < 0.5) {
                const originalIntensity = light.userData.baseIntensity || light.intensity;
                light.userData.originalIntensity = originalIntensity;
                light.intensity = 0;
                
                setTimeout(() => {
                    light.intensity = light.userData.originalIntensity || originalIntensity;
                }, 100 + Math.random() * 400);
            }
        });
        
        this.ui.enableDistortion();
        
        if (this.game.audio) {
            this.game.audio.playProceduralSound('creak');
        }
        
        return { duration: 2 };
    }
    
    updatePowerFlicker(dt) {
        // Handled in trigger
    }
    
    triggerDistantFootsteps() {
        if (this.game.audio) {
            this.game.audio.playProceduralSound('distant_footstep');
        }
        
        return { duration: 1 };
    }
    
    updateDistantFootsteps(dt) {
        // Handled in trigger
    }
    
    // ==================== UTILITY METHODS ====================
    
    getActiveEvents() {
        return Array.from(this.activeEvents.keys());
    }
    
    isEventActive(eventId) {
        return this.activeEvents.has(eventId);
    }
    
    clearAllEvents() {
        this.activeEvents.clear();
        this.eventCooldowns.clear();
        this.emptyJarActive = false;
        this.waxFigureActive = false;
        this.followedActive = false;
    }
}

export { RuleEventEngine };
