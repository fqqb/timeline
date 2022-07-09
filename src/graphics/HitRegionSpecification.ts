import { GrabHitEvent } from './GrabHitEvent';
import { MouseHitEvent } from './MouseHitEvent';
import { WheelHitEvent } from './WheelHitEvent';


export interface HitRegionSpecification {
    id: string;
    parentId?: string;

    /**
     * Cursor on hover
     */
    cursor?: string;

    click?: () => void;
    mouseEnter?: (mouseEvent: MouseHitEvent) => void;
    mouseMove?: (mouseEvent: MouseHitEvent) => void;
    mouseLeave?: (mouseEvent: MouseHitEvent) => void;
    mouseDown?: (mouseEvent: MouseHitEvent) => void;
    mouseUp?: () => void;
    grab?: (grabEvent: GrabHitEvent) => void;
    grabEnd?: () => void;
    wheel?: (wheelEvent: WheelHitEvent) => void;
}
