import { AbsoluteTimeAxis, EventLine, Timenav } from '/assets/timenav.js';

window.addEventListener('load', () => {
    const targetEl = document.getElementById('timenav');
    const timenav = new Timenav(targetEl);

    const axis = timenav.addLine(new AbsoluteTimeAxis());
    axis.frozen = true;

    const locator = timenav.addNowLocator();
    locator.knobColor = 'salmon';
    locator.lineColor = 'salmon';

    for (let i = 0; i < 20; i++) {
        const line = new EventLine();
        line.label = 'Line ' + (i + 1);
        timenav.addLine(line);
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
