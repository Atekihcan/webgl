precision mediump float;

varying vec4 fCol;

void main()
{
    float lum = dot(vec3(0.299, 0.587, 0.114), fCol.rgb);
    gl_FragColor = vec4(0.0, 0.0, 0.0, lum);
}