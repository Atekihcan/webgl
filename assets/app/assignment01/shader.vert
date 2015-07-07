attribute vec4 vPos;
attribute vec3 vCol;
uniform float theta;
uniform int twist;

varying vec4 outCol;

void main()
{
    float angle;
    if (twist != 0) {
        angle = theta * length(vPos);
    } else {
        angle = theta;
    }

    float s = sin(angle);
    float c = cos(angle);
    
    gl_Position.x = c * vPos.x - s * vPos.y;
    gl_Position.y = s * vPos.x + c * vPos.y;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
    outCol = vec4(vCol, 1);
}