# DragDrop2D

DragDrop2D is a simple GDScript framework to allow the player to drag/drop CharacterBody2Ds around. It supports:
 * Collision bodies for detecting mouse events.
 * Compatibility with 2D physics for bounds checking and constraining where the player can drag to.
 * Tracking drop regions using arbitrary Area2Ds.
 * Validating/filtering drop areas via collision layers or per physics frame.

## Usage
 * Create instances of Draggable in your scene.
 * Add at least one CollisionShape2D or CollisionPolygon2D, and set at least one layer (required for mouse detection).
 * Assign collision layer/mask for bounds checking.
 * Add other children to create the desired visuals.
 * Optionally assign a drop mask to detect drop regions.
 * Listen to the events (hovered, drag_started, drop_target_changed, drag_ended) to add logic and visual effects.

## Caveats
Because these bodies are characters, they must be the the root of the collision objects.
You could probably use RemoteTransform2D to sync the drag/drop with a sibling node, but I haven't tried that.
You can also control Draggables in script, but do so in `_physics_process` via `move_and_slide` or other physics-compatible ways.
Remember to call `super()` for overriden methods and use caution if attempting to do so while the player is dragging.

I have not tested this for mobile.

## Credits

No AI was used when creating this code.
While trying to create draggable physics objects, I was inspired by this video from Person Dude Games https://www.youtube.com/watch?v=JW_IyrcYNyQ
