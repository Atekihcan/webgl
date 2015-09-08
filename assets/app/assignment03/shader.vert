attribute vec3 vPos;
attribute vec3 vNorm;

varying vec4 fPos;
varying vec3 fNorm;

uniform mat4 u_pMatrix;
uniform mat4 u_mvMatrix;
uniform mat3 u_normMatrix;

void main()
{
    gl_PointSize = 10.0;
    fPos = u_mvMatrix * vec4(vPos, 1.0);
    fNorm = normalize(u_normMatrix * vNorm);
    gl_Position = u_pMatrix * fPos;
}