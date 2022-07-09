import { GrabHitEvent, MouseHitEvent, WheelHitEvent } from './EventHandler';

export interface HitRegionSpecification {
    id: string;
    parentId?: string;
    cursor?: string;
    click?: () => void;
    mouseEnter?: (mouseEvent: MouseHitEvent) => void;
    mouseMove?: (mouseEvent: MouseHitEvent) => void;
    mouseOut?: (mouseEvent: MouseHitEvent) => void;
    mouseDown?: (mouseEvent: MouseHitEvent) => void;
    mouseUp?: () => void;
    grab?: (grabEvent: GrabHitEvent) => void;
    grabEnd?: () => void;
    wheel?: (wheelEvent: WheelHitEvent) => void;
}
