attribute vec4 vPos;

uniform mat4 u_pMatrix;
uniform mat4 u_mvMatrix;
void main()
{
    gl_PointSize = 3.0;
    gl_Position = u_pMatrix * u_mvMatrix * vPos;
}