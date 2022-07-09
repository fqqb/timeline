---
layout: base
title: StateBand
---

# StateBand

```javascript
const band = new StateBand(timeline);
band.label = 'States';
band.states = [
    { time: -Infinity, label: 'A' },
    { time: 30, label: 'B' },
    { time: 40, label: 'C' },
    { time: 60, label: null }, // Gap
    { time: 80, label: 'D' },
];
```

A band showing state changes.

{% include demo.html src="/timeline/examples/drawables-StateBand.html"
                     height="30px"
                     caption="StateBand" %}
