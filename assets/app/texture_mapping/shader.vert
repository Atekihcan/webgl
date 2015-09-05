attribute vec4 vPos;
attribute vec3 vNorm;
attribute vec2 vTexCoord;

varying float bump;
varying vec4 fPos;
varying vec3 fNorm;
varying vec2 fTexCoord;

uniform int u_vbumpEnabled;
uniform float u_bumpAmount;
uniform sampler2D u_bump;
uniform sampler2D u_normal;
uniform mat4 u_pMatrix;
uniform mat4 u_mvMatrix;
uniform mat3 u_normMatrix;

void main()
{
    fPos = u_mvMatrix * vPos;
    //fNorm = normalize(u_normMatrix * vNorm);
    vec4 nMap = texture2D(u_normal, fTexCoord);
    fNorm = nMap.rgb * 2.0 - 1.0;
    fTexCoord = vTexCoord;
    
    if (u_vbumpEnabled != 0) {
        float bump = 1.0;
        vec4 map = texture2D(u_bump, fTexCoord);
        bump = u_bumpAmount * length(map.rgb);
        fPos += bump * vec4(fNorm, 0.0);
    }
    gl_Position = u_pMatrix * fPos;
}