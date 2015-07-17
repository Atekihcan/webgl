attribute vec4 vPos;
attribute vec3 vCol;

varying vec4 fCol;

void main()
{    
    gl_Position.x = vPos.x;
    gl_Position.y = vPos.y;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
    fCol = vec4(vCol, 1);
}