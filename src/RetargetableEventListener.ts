export interface RetargetableEventListener {

    type: 'click' | 'mousemove' | 'mouseout';
    cursor?: string;
    listener?: () => void;

    target?: { x: number, y: number, width: number, height: number; };
}
