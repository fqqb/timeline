export interface TimelineEvent {
    detail?: any;
}

export interface TimelineEventMap {
    [index: string]: TimelineEvent;
    'viewportmousemove': ViewportMouseMoveEvent;
    'viewportmouseout': ViewportMouseOutEvent;
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
