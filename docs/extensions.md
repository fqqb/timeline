---
layout: base
title: Extensions
permalink: /extensions/
order: 30
---

# Extensions

`@fqqb/timeline` introduces a general framework for interactive timeline charts, and includes a basic set of visualizations. And while these provide many configuration options, your use case may require you to take things further.

A Timeline instance is composed of three main component types:

* **Lines** show in the main area, one below another. Lines may never draw outside of their bounds (or more correctly -- if they do, it will get clipped).
* **Decorations** are drawn on top of Lines. They have access to the full main area.
* Optionally, a **Sidebar** is visible on the left, and shows the labels for each Line. When a sidebar is toggled on or off, the main area resizes optically so that it shows the same range of data as before.

All three component types are drawn with HTML5 Canvas technology, and it is possible to implement your own draw logic using custom implementations of the above components.

Note that a **Line** instance could also at the same time be a **Decoration**. For example, the [AbsoluteTimeAxis](/api/AbsoluteTimeAxis/) has an option to extend major ticks over the full height of the main area, it does this by implementing the [Decoration](/api/Decoration/) interface in addition to the [Line](/api/Line/) interface.

If you are confused about our use of the word *interface*, know that this library is written with Typescript, and then transpiled to ES6 JavaScript. This does not mean you have to do the same. All examples on this website are written in vanilla ES6 JavaScript so that they can be used directly in any modern web browser.

## Custom Line

## Custom Decoration

## Custom Sidebar

The default sidebar is only useful if you can limit your use case to rendering labels. Anything fancier, such as rendering imagery or adding custom interactions require you to either extend the [DefaultSidebar](/api/DefaultSidebar/) or write your own implementation.

Note that the sidebar must be drawn on an HTML5 Canvas. If this is too limiting, you are recommended to disable the sidebar, and instead compose one yourself in plain HTML. See this [Example](/api/examples/todo) for a start. By hooking into the event system, you can be informed of changes in line height.
