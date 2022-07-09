---
layout: base
title: LinePlot
---

# LinePlot

A band showing a line plot.

```javascript
const band = new LinePlot(timeline);
band.label = 'Plot';
band.fill = 'lime';

const points = new Map();
for (let i = 0; i < 100; i += 0.01) {
    points.set(i, Math.sin(i));
}

band.lines = [{
    points,
    pointRadius: 0,
}];
```
{% include demo.html src="/timeline/examples/drawables-LinePlot.html"
                     height="30px"
                     caption="LinePlot" %}
