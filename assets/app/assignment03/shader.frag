precision mediump float;

varying vec4 fPos;
varying vec3 fNorm;

/* light uniforms */
uniform int u_lightON;
uniform int u_pointLightOn;
uniform int u_ambientLightOn;
uniform vec4 u_ambientLight;
uniform vec4 u_pointLightSpecular;
uniform vec4 u_pointLightDiffuse;
uniform vec4 u_pointLightPos;
uniform vec4 u_matDiffuse;

/* offscreen uniforms for picking */
uniform int u_offscreen;
uniform vec3 u_color;

void main()
{
    if (u_offscreen == 1) {
        gl_FragColor = vec4(u_color, 1.0);
    } else {
        vec4 lightWeight;
        if (u_lightON != 0) {
            if (u_pointLightOn != 0) {
                vec4 lightDirection = normalize(u_pointLightPos - fPos);
                float diffuse = max(dot(vec4(fNorm, 0.0), lightDirection), 0.0);
                
                vec4 eyeDirection = normalize(-fPos);
                vec4 reflectionDirection = reflect(-lightDirection, vec4(fNorm, 0.0));
                float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 100.0);

                if (u_ambientLightOn != 0) {
                    lightWeight = u_ambientLight + diffuse * u_pointLightDiffuse + specular * u_pointLightSpecular;
                } else {
                    lightWeight = diffuse * u_pointLightDiffuse + specular * u_pointLightSpecular;
                }
            } else if (u_ambientLightOn != 0) {
                    lightWeight = u_ambientLight;
            }
        } else {
            lightWeight = vec4(1.0, 1.0, 1.0, 1.0);
        }
        gl_FragColor = lightWeight * u_matDiffuse;
    }
}