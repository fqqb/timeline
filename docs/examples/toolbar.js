import { AbsoluteTimeAxis, EventLine, MouseTracker, TimeLocator, Timenav } from '/assets/timenav.js';

window.addEventListener('load', () => {
    const targetEl = document.getElementById('timenav');
    const timenav = new Timenav(targetEl);

    const axis = new AbsoluteTimeAxis(timenav);
    axis.frozen = true;

    const locator = new TimeLocator(timenav, () => new Date().getTime());
    locator.knobColor = 'salmon';
    locator.lineColor = 'salmon';

    const tracker = new MouseTracker(timenav);

    for (let i = 0; i < 30; i++) {
        const line = new EventLine(timenav);
        line.label = 'Line ' + (i + 1);
    }

    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    const start = dt.getTime();
    dt.setDate(dt.getDate() + 1);
    const stop = dt.getTime();
    timenav.setBounds({ start, stop });

    let moveInterval;

    window.toggleMove = (x) => {
        timenav.panBy(x);
        clearInterval(moveInterval);
        moveInterval = setInterval(() => timenav.panBy(x), 50);
    };

    window.untoggleMove = () => {
        clearInterval(moveInterval);
        moveInterval = undefined;
    };

    window.pageLeft = () => {
        const x = timenav.distanceBetween(timenav.start, timenav.stop);
        timenav.panBy(-x);
    };

    window.pageRight = () => {
        const x = timenav.distanceBetween(timenav.start, timenav.stop);
        timenav.panBy(x);
    };

    window.zoomIn = () => timenav.zoomIn();
    window.zoomOut = () => timenav.zoomOut();

    window.jumpToToday = () => {
        const dt = new Date();
        dt.setHours(0, 0, 0, 0);
        const start = dt.getTime();
        dt.setDate(dt.getDate() + 1);
        const stop = dt.getTime();
        timenav.setBounds({ start, stop });
    };

    window.jumpToNow = () => timenav.panTo(new Date().getTime());

    window.toggleSidebar = () => timenav.sidebar.toggle();
});
