import { Event } from './Event';
import { Line } from './Line';

export interface TimelineEvent {
    detail?: any;
}

export interface TimelineEventMap {
    [index: string]: TimelineEvent;
    'eventclick': EventClickEvent;
    'headerclick': HeaderClickEvent;
    'viewportmousemove': ViewportMouseMoveEvent;
    'viewportmouseout': ViewportMouseOutEvent;
}

export interface EventClickEvent extends TimelineEvent {
    event: Event;
}

export interface HeaderClickEvent extends TimelineEvent {
    line: Line<any>;
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
