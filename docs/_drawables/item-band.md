---
layout: base
title: ItemBand
---

# ItemBand

A band showing items.

```javascript
const band = new ItemBand(timeline);
band.label = 'Items';
band.items = [
    { start: 20, stop: 40, label: 'Item' },
    { start: 60, label: 'Milestone' },
];
```

{% include demo.html src="/timeline/examples/drawables-ItemBand.html"
                     height="30px"
                     caption="ItemBand" %}

```javascript
const band1 = new ItemBand(timeline);
band1.label = 'Band 1';
band1.items = [
    { start: 20, stop: 40, label: 'Item 1' },
];

const band2 = new ItemBand(timeline);
band2.label = 'Band 2';
band2.itemBorderWidth = 1;
band2.itemBackground = '#ffe4b5';
band2.items = [
    { start: 10, stop: 50, label: 'Item 2' },
    { start: 40, stop: 70, label: 'Item 3', background: 'orange', cornerRadius: 5 },
    { start: 60, stop: 120, label: 'Item 4' },
];
```

{% include demo.html src="/timeline/examples/drawables-ItemBand2.html"
                     height="90px"
                     caption="ItemBand" %}
