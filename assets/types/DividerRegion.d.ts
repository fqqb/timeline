import { GrabHitEvent } from './graphics/GrabHitEvent';
import { HitRegionSpecification } from './graphics/HitRegionSpecification';
import { Timeline } from './Timeline';
export declare class DividerRegion implements HitRegionSpecification {
    private timeline;
    id: string;
    cursor: string;
    private grabStartCursor?;
    constructor(id: string, timeline: Timeline);
    mouseDown(): void;
    grab(grabEvent: GrabHitEvent): void;
    grabEnd(): void;
}
