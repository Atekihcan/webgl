attribute vec4 vPos;
attribute vec3 vNorm;
attribute vec2 vTexCoord;

varying float bump;
varying vec4 fPos;
varying vec3 fNorm;
varying vec2 fTexCoord;

uniform float u_bumpAmount;
uniform int u_vtextureType;
uniform float u_vcheckerSize;
uniform int u_textureMapType;
uniform sampler2D u_bump;
uniform mat4 u_pMatrix;
uniform mat4 u_mvMatrix;
uniform mat3 u_normMatrix;

float getCheckerBoardDepth(vec2 uv) {
    float fmodResult = mod(floor(u_vcheckerSize * uv.x) + floor(u_vcheckerSize * uv.y), 2.0);
    if (fmodResult < 1.0)
        return -0.5;
    else
        return 0.5;
}

void main()
{
    fPos = u_mvMatrix * vPos;
    fNorm = normalize(u_normMatrix * vNorm);
    if (u_textureMapType == 1) {
        fTexCoord = (vPos.xy + 1.0) / 2.0;
    } else {
        fTexCoord = vTexCoord;
    }

    float bump = 1.0;
    if (u_vtextureType != 0) {
        vec4 map = texture2D(u_bump, fTexCoord);
        bump = u_bumpAmount * length(map.rgb);
    } else {
        bump = u_bumpAmount * getCheckerBoardDepth(vTexCoord);
    }
    fPos += bump * vec4(fNorm, 0.0);

    gl_Position = u_pMatrix * fPos;
}