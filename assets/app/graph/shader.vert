attribute vec3 vPos;

uniform float u_time;
uniform mat4 u_pMatrix;
uniform mat4 u_mvMatrix;

void main()
{
    gl_PointSize = 10.0;
    gl_Position = u_mvMatrix * u_pMatrix * vec4(vPos, 1.0);
}
