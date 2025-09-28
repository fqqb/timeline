import { HitRegionSpecification } from '../graphics/HitRegionSpecification';
import { MouseHitEvent } from '../graphics/MouseHitEvent';
import { REGION_ID_VIEWPORT } from '../Timeline';
import { Band } from './Band';
import { BandMouseEnterEvent } from './BandMouseEnterEvent';
import { BandMouseLeaveEvent } from './BandMouseLeaveEvent';

export class BandRegion implements HitRegionSpecification {

    id: string;
    parentId = REGION_ID_VIEWPORT;

    constructor(id: string, private band: Band) {
        this.id = id;
    }

    mouseEnter(evt: MouseHitEvent) {
        const mouseEvent: BandMouseEnterEvent = {
            clientX: evt.clientX,
            clientY: evt.clientY,
            band: this.band,
        };
        this.band.mouseEnterListeners.forEach(l => l(mouseEvent));
    }

    mouseMove(evt: MouseHitEvent) {
        const mouseEvent = this.band.createMouseMoveEvent(evt);
        this.band.mouseMoveListeners.forEach(l => l(mouseEvent));
    }

    mouseLeave(evt: MouseHitEvent) {
        const mouseEvent: BandMouseLeaveEvent = {
            clientX: evt.clientX,
            clientY: evt.clientY,
            band: this.band,
        };
        this.band.mouseLeaveListeners.forEach(l => l(mouseEvent));
    }
}
