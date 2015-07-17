precision mediump float;

void main()
{
    gl_FragColor.r = gl_FragCoord.x / 511.0;
    gl_FragColor.g = gl_FragCoord.y / 511.0;
    gl_FragColor.b = 1.0 - gl_FragColor.r - gl_FragColor.g;
    gl_FragColor.a = 1.0;
}