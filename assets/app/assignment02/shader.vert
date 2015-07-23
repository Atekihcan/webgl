attribute vec4 vPos;
attribute vec4 vCol;

varying vec4 fCol;

void main()
{
    gl_PointSize = 3.0;
    gl_Position = vPos;
    fCol = vCol;
}