/**
 * PatrolSystem.js
 * Generates and manages patrol routes through the museum
 */

class PatrolSystem {
    constructor(environment, ui) {
        this.environment = environment;
        this.ui = ui;
        
        this.currentRoute = [];
        this.currentCheckpointIndex = 0;
        this.completedCheckpoints = [];
        this.patrolProgress = 0;
        
        // Checkpoint definitions for each hall
        this.checkpoints = {
            entrance: [
                { x: 0, z: -5, description: 'Check reception desk' },
                { x: -10, z: 0, description: 'Inspect display cases' },
                { x: 10, z: 0, description: 'Verify entrance security' }
            ],
            specimen: [
                { x: -25, z: -10, description: 'Check specimen jars (west wall)' },
                { x: -35, z: 0, description: 'Inspect storage cabinets' },
                { x: -25, z: 10, description: 'Check specimen jars (east wall)' }
            ],
            taxidermy: [
                { x: -8, z: 28, description: 'Verify taxidermy displays' },
                { x: 0, z: 32, description: 'Check center exhibit' },
                { x: 8, z: 28, description: 'Inspect rear displays' }
            ],
            evolution: [
                { x: 18, z: 20, description: 'Check wax figures (left)' },
                { x: 25, z: 30, description: 'Inspect timeline displays' },
                { x: 32, z: 20, description: 'Check wax figures (right)' }
            ],
            fossil: [
                { x: 20, z: -5, description: 'Verify fossil displays' },
                { x: 25, z: -15, description: 'Check dinosaur skeleton' },
                { x: 35, z: -10, description: 'Inspect excavation exhibit' }
            ],
            maintenance: [
                { x: 50, z: -20, description: 'Check corridor integrity' },
                { x: 50, z: 0, description: 'Inspect utility access' },
                { x: 50, z: -30, description: 'Verify rear exit' }
            ]
        };
        
        this.hallOrder = ['entrance', 'specimen', 'taxidermy', 'evolution', 'fossil'];
    }
    
    generatePatrolRoute() {
        this.currentRoute = [];
        this.currentCheckpointIndex = 0;
        this.completedCheckpoints = [];
        this.patrolProgress = 0;
        
        // Create route through all halls in order
        this.hallOrder.forEach(hallName => {
            const hallCheckpoints = this.checkpoints[hallName];
            if (hallCheckpoints) {
                hallCheckpoints.forEach(checkpoint => {
                    this.currentRoute.push({
                        hall: hallName,
                        ...checkpoint
                    });
                });
            }
        });
        
        console.log(`Patrol route generated with ${this.currentRoute.length} checkpoints`);
        this.updateCurrentObjective();
    }
    
    updateCurrentObjective() {
        if (this.currentCheckpointIndex >= this.currentRoute.length) {
            this.ui.updateObjective('Patrol complete. Return to security office or continue monitoring.');
            return;
        }
        
        const checkpoint = this.currentRoute[this.currentCheckpointIndex];
        this.ui.updateObjective(
            `PATROL: ${checkpoint.description}\nLocation: ${checkpoint.hall.toUpperCase()} HALL`
        );
    }
    
    checkCheckpointReached(playerPosition) {
        if (this.currentCheckpointIndex >= this.currentRoute.length) {
            return false;
        }
        
        const checkpoint = this.currentRoute[this.currentCheckpointIndex];
        const dx = playerPosition.x - checkpoint.x;
        const dz = playerPosition.z - checkpoint.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Check if player is within 3 units of checkpoint
        if (distance < 3) {
            this.completeCheckpoint();
            return true;
        }
        
        return false;
    }
    
    completeCheckpoint() {
        if (this.currentCheckpointIndex >= this.currentRoute.length) return;
        
        const checkpoint = this.currentRoute[this.currentCheckpointIndex];
        this.completedCheckpoints.push(checkpoint);
        this.currentCheckpointIndex++;
        this.patrolProgress = this.completedCheckpoints.length / this.currentRoute.length;
        
        console.log(`Checkpoint completed: ${checkpoint.description}`);
        
        // Play confirmation sound
        if (window.game.audio) {
            window.game.audio.playProceduralSound('jar_close');
        }
        
        this.updateCurrentObjective();
    }
    
    getCurrentHall() {
        if (this.currentCheckpointIndex >= this.currentRoute.length) {
            return null;
        }
        return this.currentRoute[this.currentCheckpointIndex].hall;
    }
    
    getNextCheckpoint() {
        if (this.currentCheckpointIndex >= this.currentRoute.length) {
            return null;
        }
        return this.currentRoute[this.currentCheckpointIndex];
    }
    
    getPatrolProgress() {
        return this.patrolProgress;
    }
    
    isPatrolComplete() {
        return this.currentCheckpointIndex >= this.currentRoute.length;
    }
    
    skipToHall(hallName) {
        // Find first checkpoint in specified hall
        const index = this.currentRoute.findIndex(cp => cp.hall === hallName);
        if (index !== -1) {
            this.currentCheckpointIndex = index;
            this.updateCurrentObjective();
        }
    }
    
    update(deltaTime) {
        if (!window.game.player) return;
        
        const playerPos = window.game.player.getPosition();
        this.checkCheckpointReached(playerPos);
    }
}

export { PatrolSystem };
