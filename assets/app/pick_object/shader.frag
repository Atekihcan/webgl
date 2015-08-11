precision mediump float;

uniform int u_offscreen;
uniform vec3 u_color;

void main()
{
    if (u_offscreen == 1) {
        gl_FragColor = vec4(u_color, 1.0);
    } else {
        gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
    }
}