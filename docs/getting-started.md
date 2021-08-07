---
layout: base
title: Getting Started
permalink: /getting-started/
order: 20
---

# Getting Started

This is a minimal setup for creating a Timeline component:

```html
<!doctype html>
<html>
<body>
    <div id="timeline" style="height: 100px"></div>
    <script type="module">
        import { Timeline } from 'https://unpkg.com/@fqqb/timeline';
        window.addEventListener('load', () => {
            const targetEl = document.getElementById('timeline');
            const timeline = new Timeline(targetEl);
        });
    </script>
</body>
</html>
```

An existing HTML DOM element is used as the host, usually a `<div>`.

A Timeline instance uses all of the available space of its host element based on the effective `clientHeight` and `clientWidth` properties. If it runs out of space, it will activate a vertical scrollbar.

This example uses an inline CSS rule to set the height to `100px`. Relative height or an absolutely positioned host element would work too.

{% include demo.html src="/examples/getting-started1.html"
                     height="100px"
                     caption="An empty timeline" %}

This empty Timeline shows the main structure: a left **sidebar** and the **main area**. Notice how the sidebar can be resized.


## Adding Lines

The main area defaults to showing a numeric range between 0 and 100. With this knowledge, let's display a few events.

```javascript
const line1 = new EventLine(timeline);
line1.label = 'Line 1';
line1.events = [
    { start: 20, stop: 40, label: 'Event 1' },
];

const line2 = new EventLine(timeline);
line2.label = 'Line 2';
line2.eventBorderWidth = 0;
line2.eventColor = '#ffe4b5';
line2.events = [
    { start: 10, stop: 50, label: 'Event 2' },
    { start: 40, stop: 70, label: 'Event 3', color: 'orange', cornerRadius: 5 },
    { start: 60, stop: 120, label: 'Event 4' },
];
```

{% include demo.html src="/examples/getting-started2.html"
                     height="100px"
                     caption="First data" %}

Event 4 is not fully visible, but you can pan the Timeline canvas.


## Absolute Time

A common use case is to render real life events. That is &ndash; using absolute time.

If we consider time to be milliseconds since 1 January 1970 UTC, we can use JavaScript Dates to show a specific calendar time range.

Let's do that, and replace our event data with absolute timestamps too.

```javascript
// Show 'today' (using local time)
const start = new Date();
start.setHours(0, 0, 0, 0);
const stop = new Date(start.getTime());
stop.setDate(stop.getDate() + 1);

timeline.setBounds(start.getTime(), stop.getTime());

const axis = new AbsoluteTimeAxis(timeline);
axis.label = 'Time';

const line1 = new EventLine(timeline);
line1.label = 'Line 1';
line1.events = [{
    start: start.getTime() + 3000000,
    stop: start.getTime() + 50000000,
    label: 'Event 1'
}];

const line2 = new EventLine(timeline);
line2.label = 'Line 2';
line2.events = [{
    start: start.getTime() + 6000000,
    stop: start.getTime() + 12500000,
    label: 'Event 2'
}];
```

{% include demo.html src="/examples/getting-started3.html"
                     height="100px"
                     caption="Absolute time" %}

This example adds an [AbsoluteTimeAxis](/api/AbsoluteTimeAxis/), a special type of [Line](/api/Line/) that renders an autoranged timescale.
