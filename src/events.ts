export interface TimenavEvent {
    detail?: any;
}

export interface TimenavEventMap {
    [index: string]: TimenavEvent;
    'viewportmousemove': ViewportMouseMoveEvent;
    'viewportmouseout': ViewportMouseOutEvent;
}

export interface ViewportMouseMoveEvent extends TimenavEvent {
    clientX: number;
    clientY: number;
    viewportX: number;
    viewportY: number;
    time: number;
}

export interface ViewportMouseOutEvent extends TimenavEvent {
    clientX: number;
    clientY: number;
}

export type TimenavEventHandlers = {
    [index: string]: Array<(ev: TimenavEvent) => void>;
};
