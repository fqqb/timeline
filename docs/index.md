---
layout: base
title: About @fqqb/timeline
---

**@fqqb/timeline** is a framework-agnostic JavaScript library for rendering interactive timeline charts such as this:

{% example mainpage.html %}


## Download

````
npm install --save @fqqb/timeline
````


## Usage

ES Modules:

```html
<div id="timeline"></div>
<script type="module">
    import { Timeline } from 'https://unpkg.com/@fqqb/timeline';

    const targetEl = document.getElementById('timeline');
    const timeline = new Timeline(targetEl);
    // ...
</script>
```


UMD:

```html
<div id="timeline"></div>
<script src="https://unpkg.com/@fqqb/timeline"></script>
<script>
    const targetEl = document.getElementById('timeline');
    const timeline = new tn.Timeline(targetEl);
    // ...
</script>
```
