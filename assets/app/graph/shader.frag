precision mediump float;

uniform int u_offscreen;
uniform vec3 u_color;
uniform vec4 u_matDiffuse;

void main()
{
    if (u_offscreen == 1) {
        gl_FragColor = vec4(u_color, 1.0);
    } else {
        gl_FragColor = u_matDiffuse;
    }
}
