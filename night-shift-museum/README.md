# Night Shift: Museum Protocol

A first-person psychological horror game built with Three.js. You are a night security guard at a natural history museum, surviving until dawn while following mysterious survival rules left by the previous guard who vanished under unknown circumstances.

## 🎮 Game Features

### Core Gameplay
- **First-person horror exploration** in a detailed museum environment
- **Rule-based survival mechanics** - Follow the 5 survival rules or face deadly consequences
- **Dynamic event system** - Weighted random events with escalating difficulty
- **Advanced monster AI** - Finite state machine behavior with patrol, stalk, hunt, and chase states
- **Resource management** - Manage flashlight battery and food for distractions
- **Patrol system** - Complete checkpoint-based patrol routes through museum halls

### The 5 Survival Rules
1. **Empty Specimen Jar**: If you find an empty jar, you have 4 minutes to return the creature before it hunts you
2. **Taxidermy Hall**: Always enter with flashlight ON and keep it aimed at the animals
3. **Breathing Wax Figure**: If you see one breathing, leave without breaking eye contact and wait 30 minutes
4. **Being Chased**: Throw food to distract, then hide behind cover
5. **Being Followed**: Don't turn around until you reach the Fossil Hall (safe zone)

### Museum Locations
- **Entrance Lobby** - Main entrance with reception desk
- **Specimen Hall** - Contains preserved specimens in jars
- **Taxidermy Hall** - Stuffed animals that may not be as dead as they appear
- **Evolution Hall** - Wax figures depicting human evolution
- **Fossil Hall** - Ancient skeletons and dinosaur exhibits (safe zone)
- **Security Office** - Your starting point
- **Maintenance Corridor** - Hidden back areas with flickering lights

## 🚀 Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, or Safari)
- WebGL 2.0 support
- No installation required - runs directly in browser

### Running the Game

#### Option 1: Direct Browser (Recommended for Testing)
1. Navigate to the project folder
2. Open `index.html` directly in your browser
   - Note: Some browsers may block certain features when running from `file://` protocol
   
#### Option 2: Local Web Server (Best Experience)
```bash
# Using Python 3
cd night-shift-museum
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Then open http://localhost:8000 in your browser
```

#### Option 3: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🎯 Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Mouse | Look around |
| Left Click | Interact |
| Right Click / F | Toggle Flashlight |
| Shift | Sprint |
| Ctrl / C | Crouch |
| Space | Jump |
| E | Throw Food |
| R | Show Rules Hint |
| Escape | Pause Menu |

## 🏗️ Architecture

### Project Structure
```
night-shift-museum/
├── index.html              # Main HTML file with UI overlays
├── scripts/
│   ├── controllers/
│   │   ├── GameController.js    # Main game loop and state management
│   │   └── PlayerController.js  # First-person player controls
│   ├── systems/
│   │   ├── MuseumEnvironment.js # Museum layout and interactive objects
│   │   ├── InventorySystem.js   # Item and resource management
│   │   ├── AudioManager.js      # Procedural audio generation
│   │   └── PatrolSystem.js      # Patrol route generation
│   ├── ai/
│   │   └── MonsterAI.js         # Monster behavior and FSM
│   ├── events/
│   │   └── RuleEventEngine.js   # Rule-based event system
│   └── ui/
│       └── UIManager.js         # HUD and menu management
├── assets/
│   ├── models/             # GLB model files (monsters, props)
│   ├── textures/           # Texture files
│   └── audio/              # Audio files (optional)
└── README.md               # This file
```

### System Design

#### GameController
Central coordinator managing all game systems, game state, and the main render loop.

#### PlayerController
Handles first-person movement using PointerLockControls, flashlight mechanics, and player interactions.

#### MuseumEnvironment
Procedurally generates the museum layout with collision walls, interactive objects, and dynamic lighting.

#### RuleEventEngine
Modular event system with weighted randomness, cooldowns, and difficulty scaling. Each rule is implemented as a triggerable event with specific conditions and behaviors.

#### MonsterAI
Finite state machine implementation with states: IDLE, PATROL, STALK, HUNT, CHASE, DISTRACTED. Includes perception system (field of view, detection range, line of sight) and reaction to player actions.

#### AudioManager
Procedural audio generation using Web Audio API for ambient soundscapes, footsteps, creaks, whispers, and other horror elements.

## 🔧 Customization

### Adding New Monsters
Edit `MonsterAI.js` and add new monster configurations in the `createMonsters()` method:

```javascript
this.createMonster({
    id: 'new_monster',
    type: 'custom_type',
    position: new THREE.Vector3(x, 0, z),
    speed: 5,
    detectionRange: 25,
    aggression: 0.8,
    modelColor: 0xRRGGBB,
    scale: 1.0
});
```

### Adding New Events
Edit `RuleEventEngine.js` and add to `eventDefinitions` array:

```javascript
{
    id: 'new_event',
    weight: 20,
    minTime: 60,
    cooldown: 300,
    trigger: () => this.triggerNewEvent(),
    update: (dt) => this.updateNewEvent(dt)
}
```

### Modifying Museum Layout
Edit `MuseumEnvironment.js` to add new halls, modify existing ones, or change lighting.

## 🎨 Asset Pipeline

### Importing GLB Models
The game supports `.glb` model imports for monsters and props. To add custom models:

1. Place `.glb` files in `assets/models/`
2. Use the GLTFLoader to import:
```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('assets/models/your_model.glb', (gltf) => {
    const model = gltf.scene;
    // Adjust scale
    model.scale.set(1, 1, 1);
    scene.add(model);
});
```

### Model Requirements
- Human-relative proportions (approximately 1.7-2.0 units tall)
- Optimized geometry for real-time rendering
- PBR materials preferred
- Optional: Rigging and animations

## ⚙️ Performance Considerations

- Target: 60 FPS on modern hardware
- Dynamic shadow quality adjusts based on performance
- Fog system hides draw distance limitations
- Instanced rendering used for repeated objects

## 🐛 Known Limitations

This prototype uses placeholder geometry for monsters and props. For production:
- Replace capsule/sphere placeholders with actual GLB models
- Add proper collision detection system
- Implement navmesh for monster pathfinding
- Add baked lighting for better performance
- Include texture atlases for optimization

## 📝 Future Enhancements

- [ ] Save/load system for game progress
- [ ] Additional museum halls and secrets
- [ ] More monster varieties with unique behaviors
- [ ] Collectible lore items and notes
- [ ] Multiple endings based on player choices
- [ ] Achievement system
- [ ] Accessibility options (colorblind mode, subtitle size)
- [ ] VR support
- [ ] Multiplayer co-op mode

## 🎵 Audio

All audio is procedurally generated using the Web Audio API, including:
- Ambient drone soundscapes
- HVAC hum simulation
- Random footsteps and creaks
- Monster vocalizations
- Interactive sound effects

## 📄 License

This project is a prototype for educational and portfolio purposes.

## 👥 Credits

**Night Shift: Museum Protocol**
- Lead Design & Architecture
- Senior HTML Engineering
- 3D Technical Art
- Gameplay Programming
- AI Systems Design
- UX / Horror Experience Design

Built with Three.js and Web Audio API.

---

*"The previous guard vanished. Only his notes remain."*

Good luck on your night shift, guard. You'll need it.
