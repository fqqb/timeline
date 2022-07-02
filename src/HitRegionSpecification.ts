import { TimelineMouseEvent } from './DOMEventHandler';

export interface HitRegionSpecification {
    id: string;
    click?: () => void;
    mouseEnter?: (mouseEvent: TimelineMouseEvent) => void;
    mouseMove?: (mouseEvent: TimelineMouseEvent) => void;
    mouseOut?: (mouseEvent: TimelineMouseEvent) => void;
    mouseDown?: () => void;
    mouseUp?: () => void;
    cursor?: string;
}
