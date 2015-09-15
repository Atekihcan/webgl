precision mediump float;

/* texture */
varying vec2 fTexCoord;
uniform sampler2D u_texture;

void main()
{
    gl_FragColor = texture2D(u_texture, fTexCoord);
}