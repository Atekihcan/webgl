attribute vec4 vPos;

void main()
{
    gl_PointSize = 3.0;
    gl_Position = vPos;
}