import { Timenav } from './Timenav';

export abstract class Decoration {

    id?: string;
    private mutationListeners: Array<() => void> = [];

    addMutationListener(mutationListener: () => void) {
        if (this.mutationListeners.indexOf(mutationListener) === -1) {
            this.mutationListeners.push(mutationListener);
        }
    }

    removeMutationListener(mutationListener: () => void) {
        const idx = this.mutationListeners.indexOf(mutationListener);
        if (idx !== -1) {
            this.mutationListeners.splice(idx, 1);
        }
    }

    protected reportMutation() {
        this.mutationListeners.forEach(listener => listener());
    }

    abstract draw(ctx: CanvasRenderingContext2D, timenav: Timenav): void;
}
