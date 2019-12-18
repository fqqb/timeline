---
layout: base
title: About timenav.js
order: 10
---

**timenav.js** is a framework-agnostic JavaScript library for rendering interactive timeline charts such as this:

{% include demo.html %}


## Download

````
npm install --save timenav
````


## Usage

ES Modules:

```html
<div id="timenav"></div>
<script type="module">
    import { Timenav } from 'https://unpkg.com/timenav/timenav.js';

    const targetEl = document.getElementById('timenav');
    const timenav = new Timenav(targetEl);
    // ...
</script>
```


UMD:

```html
<div id="timenav"></div>
<script src="https://unpkg.com/timenav/timenav.umd.js"></script>
<script>
    const targetEl = document.getElementById('timenav');
    const timenav = new tn.Timenav(targetEl);
    // ...
</script>
```
