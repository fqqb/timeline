import { CanvasGrabEvent, CanvasMouseEvent } from './EventHandler';

export interface HitRegionSpecification {
    id: string;
    parentId?: string;
    click?: () => void;
    mouseEnter?: (mouseEvent: CanvasMouseEvent) => void;
    mouseMove?: (mouseEvent: CanvasMouseEvent) => void;
    mouseOut?: (mouseEvent: CanvasMouseEvent) => void;
    mouseDown?: (mouseEvent: CanvasMouseEvent) => void;
    mouseUp?: () => void;
    grab?: (grabEvent: CanvasGrabEvent) => void;
    grabEnd?: () => void;
    cursor?: string;
}
