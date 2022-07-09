---
layout: base
title: API Reference
permalink: /api/
order: 40
---

# API Reference

<table>
    <tr>
        <th width="1">Name</th>
        <th width="1">Kind</th>
        <th>Description</th>
    </tr>

    {%- assign sorted_children = site.data.tsdoc.children | sort_natural:"name" -%}
    {%- for child in sorted_children -%}
        {%- assign page = nil -%}
        {%- for p in site.api -%}
            {%- if p.title == child.name -%}
                {%- assign page = p -%}
                {%- break -%}
            {%- endif -%}
        {%- endfor -%}
        <tr>
            <td style="white-space: nowrap">
                {%- if page -%}
                    <a href="/timeline{{- page.url -}}">{{- child.name -}}</a>
                {%- else -%}
                    <span style="font-style: italic">{{- child.name -}}</span>
                {%- endif -%}
            </td>
            <td style="white-space: nowrap">
                {{- child.kindString -}}
            </td>
            <td>
                {%- include tsdoc_comment_abbr.html comment=child.comment -%}
            </td>
        </tr>
    {%- endfor -%}

</table>
