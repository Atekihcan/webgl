precision mediump float;

varying vec3 fLightWeight;

uniform vec4 u_materialColor;

void main()
{
    gl_FragColor = vec4(u_materialColor.rgb * fLightWeight, u_materialColor.a);
}