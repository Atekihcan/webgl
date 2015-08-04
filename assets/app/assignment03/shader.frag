precision mediump float;

varying vec4 fPos;
varying vec3 fNorm;

uniform int u_lightON;
uniform vec3 u_ambientLight;
uniform vec3 u_pointLightSpecular;
uniform vec3 u_pointLightDiffuse;
uniform vec4 u_pointLightPos;
uniform vec4 u_materialColor;

void main()
{
    vec3 lightWeight;
    if (u_lightON != 0) {
        vec4 lightDirection = normalize(u_pointLightPos - fPos);
        float diffuse = max(dot(vec4(fNorm, 0.0), lightDirection), 0.0);
        
        vec4 eyeDirection = normalize(-fPos);
        vec4 reflectionDirection = reflect(-lightDirection, vec4(fNorm, 0.0));
        float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 100.0);

        lightWeight = u_ambientLight + diffuse * u_pointLightDiffuse + specular * u_pointLightSpecular;
    } else {
        lightWeight = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4((lightWeight * u_materialColor.rgb), 1.0);
}
