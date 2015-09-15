attribute vec4 vPos;
attribute vec2 vTexCoord;

varying vec2 fTexCoord;

uniform mat4 u_pMatrix;
uniform mat4 u_mvMatrix;

void main()
{
    fTexCoord = vTexCoord;
    gl_Position = u_pMatrix * u_mvMatrix * vPos;
}