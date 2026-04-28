/**
 * InventorySystem.js
 * Manages player inventory items and resources
 */

class InventorySystem {
    constructor(uiManager) {
        this.ui = uiManager;
        
        // Inventory items
        this.food = 3;
        this.battery = 100;
        this.specimenCaptureTool = false;
        this.notes = [];
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        if (this.ui) {
            this.ui.updateFoodCount(this.food);
            this.ui.updateBatteryLevel(this.battery);
        }
    }
    
    hasFood() {
        return this.food > 0;
    }
    
    useFood() {
        if (this.food > 0) {
            this.food--;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    addFood(amount = 1) {
        this.food += amount;
        this.updateUI();
    }
    
    useBattery(amount) {
        this.battery = Math.max(0, this.battery - amount);
        this.updateUI();
    }
    
    rechargeBattery(amount) {
        this.battery = Math.min(100, this.battery + amount);
        this.updateUI();
    }
    
    hasSpecimenTool() {
        return this.specimenCaptureTool;
    }
    
    pickUpSpecimenTool() {
        if (!this.specimenCaptureTool) {
            this.specimenCaptureTool = true;
            if (this.ui) {
                this.ui.updateObjective('Acquired specimen capture tool. You can now contain escaped creatures.');
            }
        }
    }
    
    addNote(note) {
        if (!this.notes.includes(note)) {
            this.notes.push(note);
            if (this.ui) {
                this.ui.showWarning('📝 New note added to journal', 2000);
            }
        }
    }
    
    getNotes() {
        return this.notes;
    }
    
    findItem(itemType) {
        switch(itemType) {
            case 'food':
                return this.hasFood();
            case 'battery':
                return this.battery > 0;
            case 'specimen_tool':
                return this.hasSpecimenTool();
            default:
                return false;
        }
    }
}

export { InventorySystem };
