---
title:    maxwell_triangle
subtitle: "Maxwell Triangle"
date:     2015-07-14 14:51
---

<div class="col-md-8 col-md-offset-2">
    <canvas id="gl-canvas" width="512" height="512">
        Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>
</div>

<div class="row">
    <div class="col-md-12 text-center">
        <span id="frag_type">Simple</span><br/><br/>
    </div>
</div>

<div class="row">
    <div class="col-md-4 text-center"><button onclick="setFragmentShader(0, 'frag_type')">Simple</button></div>
    <div class="col-md-4 text-center"><button onclick="setFragmentShader(1, 'frag_type')">Interpolate</button></div>
    <div class="col-md-4 text-center"><button onclick="setFragmentShader(2, 'frag_type')">Luminance</button></div>
</div>