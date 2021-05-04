import { Event } from './Event';

export interface TimelineEvent {
    detail?: any;
}

export interface TimelineEventMap {
    [index: string]: TimelineEvent;
    'eventclick': EventClickEvent;
    'viewportmousemove': ViewportMouseMoveEvent;
    'viewportmouseout': ViewportMouseOutEvent;
}

export interface EventClickEvent extends TimelineEvent {
    event: Event;
}

export interface ViewportMouseMoveEvent extends TimelineEvent {
    clientX: number;
    clientY: number;
    viewportX: number;
    viewportY: number;
    time: number;
}

export interface ViewportMouseOutEvent extends TimelineEvent {
    clientX: number;
    clientY: number;
}

export type TimelineEventHandlers = {
    [index: string]: Array<(ev: TimelineEvent) => void>;
};
