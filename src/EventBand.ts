import { Band } from './Band';
import { Timeline } from './Timeline';

export class EventBand extends Band {

    constructor(timeline: Timeline, label?: string) {
        super(timeline, label);
    }
}
