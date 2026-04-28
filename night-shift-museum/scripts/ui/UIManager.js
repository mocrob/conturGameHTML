/**
 * UIManager.js
 * Handles all UI updates and display logic
 */

class UIManager {
    constructor(gameController) {
        this.game = gameController;
        this.currentObjective = 'Begin patrol of the museum';
        this.rulesVisible = false;
    }
    
    updateObjective(text) {
        this.currentObjective = text;
        const objectiveElement = document.getElementById('objective-text');
        if (objectiveElement) {
            objectiveElement.textContent = text;
        }
    }
    
    updateShiftTime(seconds) {
        // Convert seconds to museum time (midnight to 6 AM)
        const totalMinutes = Math.floor((seconds / 21600) * 360); // 6 hours = 360 minutes
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        
        const hour12 = hours === 0 ? 12 : hours;
        const ampm = 'AM';
        const timeString = `${hour12}:${mins.toString().padStart(2, '0')} ${ampm}`;
        
        const timeElement = document.getElementById('shift-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }
    
    updateBatteryLevel(percent) {
        const batteryElement = document.getElementById('battery-level');
        if (batteryElement) {
            batteryElement.textContent = `${percent}%`;
            
            // Change color based on level
            if (percent < 20) {
                batteryElement.style.color = '#ff0000';
            } else if (percent < 50) {
                batteryElement.style.color = '#ffaa00';
            } else {
                batteryElement.style.color = '#ffcc00';
            }
        }
    }
    
    updateFoodCount(count) {
        const foodElement = document.getElementById('food-count');
        if (foodElement) {
            foodElement.textContent = `🍖 Food: ${count}`;
        }
    }
    
    showRulesHint() {
        const rulesElement = document.getElementById('rules-text');
        if (rulesElement) {
            const hints = [
                "Remember the previous guard's notes...",
                "Rule 1: Empty jar = 4 minutes to find creature",
                "Rule 2: Flashlight ON in taxidermy hall",
                "Rule 3: Don't break eye contact with breathing figure",
                "Rule 4: Throw food when chased, then hide",
                "Rule 5: Don't turn around until fossil hall"
            ];
            
            const randomHint = hints[Math.floor(Math.random() * hints.length)];
            rulesElement.textContent = randomHint;
            
            // Clear after 5 seconds
            setTimeout(() => {
                rulesElement.textContent = "Remember the previous guard's notes...";
            }, 5000);
        }
    }
    
    showWarning(message, duration = 3000) {
        // Create temporary warning overlay
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(204, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            font-size: 24px;
            font-family: 'Courier New', monospace;
            border: 2px solid #ff0000;
            z-index: 300;
            pointer-events: none;
        `;
        warning.textContent = message;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, duration);
    }
    
    showBloodOverlay(intensity = 0.5) {
        const overlay = document.getElementById('blood-overlay');
        if (overlay) {
            overlay.style.opacity = intensity;
            setTimeout(() => {
                overlay.style.opacity = 0;
            }, 1000);
        }
    }
    
    enableDistortion() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.classList.add('distortion-active');
            setTimeout(() => {
                uiLayer.classList.remove('distortion-active');
            }, 2000);
        }
    }
    
    updateMonsterWarning(distance) {
        if (distance < 10) {
            this.showWarning('⚠️ DANGER - CLOSE PROXIMITY ⚠️', 1000);
        }
    }
}

export { UIManager };
