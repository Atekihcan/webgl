attribute vec4 vPos;

void main()
{
    gl_PointSize = 3.0;
    gl_Position.x = vPos.x;
    gl_Position.y = vPos.y;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
}