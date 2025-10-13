import { GrabHitEvent } from '../../graphics/GrabHitEvent';
import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { MouseHitEvent } from '../../graphics/MouseHitEvent';
import { WheelHitEvent } from '../../graphics/WheelHitEvent';
import { Timeline } from '../../Timeline';
import { ViewportRegion } from '../../ViewportRegion';
import { BandRegion } from '../BandRegion';
import { TimeRuler } from './TimeRuler';

/**
 * Region covering the entire timeruler viewport. Adds zoom actions
 */
export class TimeRulerRegion implements HitRegionSpecification {
    id: string;
    parentId: string;
    cursor = 'col-resize';

    private timeline: Timeline;
    private viewportRegion: ViewportRegion;

    // Position around which to zoom in or out.
    // (value between 0 and 1, where 1 is the width of the timeline)
    private startPosition?: number;
    private startTime?: number;
    private originalStart?: number;
    private originalStop?: number;

    constructor(bandRegion: BandRegion, private timeRuler: TimeRuler) {
        this.id = bandRegion.id + '_timeruler';
        this.parentId = bandRegion.id;
        this.timeline = timeRuler.timeline;
        this.viewportRegion = timeRuler.timeline.viewportRegion;
    }

    mouseDown(mouseEvent: MouseHitEvent) {
        this.startPosition = mouseEvent.x / this.timeline.mainWidth;
        this.startTime = this.timeline.timeForCanvasPosition(mouseEvent.x);
        this.originalStart = this.timeline.start;
        this.originalStop = this.timeline.stop;
    }

    grab(grabEvent: GrabHitEvent) {
        const grabPosition = grabEvent.x / this.timeline.mainWidth;

        const delta = this.startPosition! - grabPosition;
        if (delta > 0) {
            const factor = 1 + delta * this.timeRuler.zoomMultiplier;
            this.zoom(factor);
        } else if (delta < 0) {
            const factor = 1 / (1 + Math.abs(delta * this.timeRuler.zoomMultiplier));
            this.zoom(factor);
        } else {
            this.zoom(1); // Reset zoom
        }
    }

    /**
     * Zoom by a factor relative to the original viewport (at grab start).
     *
     * 2 means twice the viewport range
     * 0.5 means half the viewport range
     */
    private zoom(factor: number) {
        const relto = this.startTime!;
        const start = this.originalStart!;
        const stop = this.originalStop!;
        const reltoRatio = (relto - start) / (stop - start);
        const prevRange = stop - start;
        const nextRange = prevRange * factor;

        const newStart = relto - reltoRatio * nextRange;
        const newStop = relto + (1 - reltoRatio) * nextRange;
        this.timeline.setViewRange(newStart, newStop, false);
    }

    grabEnd() {
        this.startTime = undefined;
        this.startPosition = undefined;
        this.originalStart = undefined;
        this.originalStop = undefined;
    }

    wheel(wheelEvent: WheelHitEvent) {
        this.viewportRegion.wheel(wheelEvent);
    }
}
