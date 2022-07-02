import { TimelineGrabEvent, TimelineMouseEvent } from './DOMEventHandler';

export interface HitRegionSpecification {
    id: string;
    click?: () => void;
    mouseEnter?: (mouseEvent: TimelineMouseEvent) => void;
    mouseMove?: (mouseEvent: TimelineMouseEvent) => void;
    mouseOut?: (mouseEvent: TimelineMouseEvent) => void;
    mouseDown?: (mouseEvent: TimelineMouseEvent) => void;
    mouseUp?: () => void;
    grab?: (gravEnent: TimelineGrabEvent) => void;
    grabEnd?: () => void;
    cursor?: string;
}
