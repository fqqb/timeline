---
layout: base
title: Getting Started
permalink: /getting-started/
order: 20
---

# Getting Started

A minimal setup for creating a Timenav component goes like this:

```html
<!doctype html>
<html>
<body>
    <div id="timenav" style="height: 100px"></div>
    <script type="module">
        import { Timenav } from 'https://unpkg.com/timenav/timenav.js';
        window.addEventListener('load', () => {
            const targetEl = document.getElementById('timenav');
            new Timenav(targetEl);
        });
    </script>
</body>
</html>
```

You must specify an existing HTML DOM element as the host. This is typically a `<div>`, but any block element will do.

A Timenav instance will automatically use all of the available space of its host element, based on the effective `clientHeight` and `clientWidth` properties. In this example we use an inline CSS rule to set the height to `100px`, but you can also use other other means to set the height.

While functional, our first Timenav looks rather bare-bones:

{% include demo.html src="/examples/getting-started1.html"
                     height="100px"
                     caption="An empty timenav" %}

We see just two empty panels: a **sidebar** and the **main area**. Notice how the sidebar can be resized with the mouse.


## Adding Lines

The main area defaults to showing a numeric range between 0 and 100. We can use this knowledge to position a few events.

```javascript
const line1 = new EventLine();
line1.label = 'Line 1';
timenav.addLine(line1);

const line2 = new EventLine();
line2.label = 'Line 2';
timenav.addLine(line2);

line1.data = [
    { start: 20, stop: 40, label: 'Event 1' },
];

line2.data = [
    { start: 10, stop: 50, label: 'Event 2' },
    { start: 40, stop: 70, label: 'Event 3' },
    { start: 60, stop: 120, label: 'Event 4' },
];
```

{% include demo.html src="/examples/getting-started2.html"
                     height="100px"
                     caption="First data" %}

Event 4 is not fully visible, but you can use the mouse to pan the Timenav canvas.


## Absolute Time

If we consider time to be milliseconds since 1 January 1970 UTC, we can use JavaScript Dates to show a specific calendar time range.

Let's do that, and replace our event data with absolute timestamps too.

{% include demo.html src="/examples/getting-started3.html"
                     height="100px"
                     caption="Absolute time" %}

We've also added an [AbsoluteTimeAxis](/api/AbsoluteTimeAxis/) to this example. This is a special type of [Line](/api/Line/) that renders an autoranged timescale. This built-in axis has support for displaying absolute time in UTC or local time formats only. For other use cases you are recommended to write a custom [Line](/api/Line/) subclass.
