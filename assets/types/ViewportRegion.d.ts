import { GrabHitEvent } from './graphics/GrabHitEvent';
import { HitRegionSpecification } from './graphics/HitRegionSpecification';
import { KeyboardHitEvent } from './graphics/KeyboardHitEvent';
import { MouseHitEvent } from './graphics/MouseHitEvent';
import { WheelHitEvent } from './graphics/WheelHitEvent';
import { Timeline } from './Timeline';
import { ViewportDoubleClickEvent } from './ViewportDoubleClickEvent';
import { ViewportMouseLeaveEvent } from './ViewportMouseLeaveEvent';
import { ViewportMouseMoveEvent } from './ViewportMouseMoveEvent';
export declare class ViewportRegion implements HitRegionSpecification {
    private timeline;
    id: string;
    private grabStartPoint?;
    private grabStartCursor?;
    private doubleClickListeners;
    private mouseMoveListeners;
    private mouseLeaveListeners;
    constructor(id: string, timeline: Timeline);
    /**
     * Register a listener that recevies updates whenever the viewport
     * is double-clicked.
     */
    addDoubleClickListener(listener: (ev: ViewportDoubleClickEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * viewport double-click events.
     */
    removeDoubleClickListener(listener: (ev: ViewportDoubleClickEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over the viewport.
     */
    addMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * viewport mouse-move events.
     */
    removeMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside the viewport.
     */
    addMouseLeaveListener(listener: (ev: ViewportMouseLeaveEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * mouse-leave events.
     */
    removeMouseLeaveListener(listener: (ev: ViewportMouseLeaveEvent) => void): void;
    doubleClick(mouseEvent: MouseHitEvent): void;
    click(): void;
    mouseDown(mouseEvent: MouseHitEvent): void;
    grab(grabEvent: GrabHitEvent): void;
    grabEnd(): void;
    wheel(wheelEvent: WheelHitEvent): void;
    mouseMove(mouseEvent: MouseHitEvent): void;
    mouseLeave(mouseEvent: MouseHitEvent): void;
    keyDown(event: KeyboardHitEvent): void;
}
