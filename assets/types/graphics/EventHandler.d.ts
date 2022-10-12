import { HitCanvas } from './HitCanvas';
/**
 * Translates Canvas DOM events into non-DOM hit events.
 */
export declare class EventHandler {
    private canvas;
    private hitCanvas;
    private grabbing;
    private grabTarget?;
    private grabPoint?;
    private grabbingPoint?;
    private documentMouseMoveListener;
    private documentMouseUpListener;
    private documentTouchMoveListener;
    private documentTouchEndListener;
    private prevActiveRegions;
    constructor(canvas: HTMLCanvasElement, hitCanvas: HitCanvas);
    private onCanvasClick;
    private onCanvasDoubleClick;
    private onCanvasKeyDown;
    private onCanvasKeyUp;
    private onCanvasContextMenu;
    private onCanvasMouseDown;
    private onCanvasMouseUp;
    private onCanvasMouseLeave;
    private wasActive;
    private onCanvasMouseMove;
    private onCanvasTouchStart;
    private onCanvasTouchMove;
    private onCanvasWheel;
    private onDocumentMouseUp;
    private onDocumentMouseMove;
    private onDocumentTouchEnd;
    private onDocumentTouchMove;
    private toMouseHitEvent;
    private toTouchHitEvent;
    private toGrabHitEvent;
    private toKeyboardHitEvent;
}
