import { GrabHitEvent } from '../../graphics/GrabHitEvent';
import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { MouseHitEvent } from '../../graphics/MouseHitEvent';
import { ViewportRegion } from '../../ViewportRegion';
import { BandRegion } from '../BandRegion';
import { LinePlot } from './LinePlot';

/**
 * Region covering the entire lineplot viewport. Adds an additional grab
 * event to apply vertical movement.
 */
export class LinePlotRegion implements HitRegionSpecification {
    id: string;
    parentId: string;

    private viewportRegion: ViewportRegion;

    constructor(bandRegion: BandRegion, private linePlot: LinePlot) {
        this.id = bandRegion.id + '_lineplot';
        this.parentId = bandRegion.id;
        this.viewportRegion = linePlot.timeline.viewportRegion;
    }

    grab(grabEvent: GrabHitEvent) {
        this.viewportRegion.grab(grabEvent);

        if (this.linePlot.timeline.tool === 'hand') {
            const panMovement = -grabEvent.movementY;
            const { contentHeight } = this.linePlot;

            let min = this.valueForPosition(contentHeight + panMovement);
            let max = this.valueForPosition(0 + panMovement);
            if (max < min) {
                [min, max] = [max, min];
            }

            if (panMovement !== 0) {
                this.linePlot.setAxisRange(min, max);
            }
        }
    }

    doubleClick(mouseEvent: MouseHitEvent) {
        this.viewportRegion.doubleClick(mouseEvent);

        this.linePlot.resetAxisRange();
    }

    private valueForPosition(position: number) {
        return this.linePlot.valueForPositionFn!(position);
    }
}
