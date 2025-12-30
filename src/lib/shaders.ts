// Shader programs for 3 evaluators visualization
// All using Ether effect with different colors

// Shader 1: Ether - 보라색 (Purple - Evaluator A)
export const etherPurple = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform bool isActive;
varying vec2 vTextureCoord;

#define t iTime
mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}
float map(vec3 p){
    p.xz*= m(t*0.4);p.xy*= m(t*0.3);
    vec3 q = p*2.+t;
    return length(p+vec3(sin(t*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = fragCoord.xy/min(iResolution.x, iResolution.y) - vec2(.9, .5);
    p.x += 0.4;

    vec3 cl = vec3(0.);
    float d = 2.5;

    for(int i=0; i<=5; i++) {
        vec3 p3d = vec3(0,0,5.) + normalize(vec3(p, -1.))*d;
        float rz = map(p3d);
        float f = clamp((rz - map(p3d+.1))*0.5, -.1, 1.);

        // 보라색 (Purple) 색상
        vec3 baseColor;
        if(isActive) {
            baseColor = vec3(0.2, 0.1, 0.4) + vec3(3.0, 1.5, 5.0)*f;
        } else {
            baseColor = vec3(0.15, 0.05, 0.3) + vec3(2.5, 1.0, 4.0)*f;
        }

        cl = cl*baseColor + smoothstep(2.5, .0, rz)*.7*baseColor;
        d += min(rz, 1.);
    }

    fragColor = vec4(cl, 1.0);
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;

    vec2 center = iResolution * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;

    // Soft edge fade - starts fading at 70% of radius
    float edgeSoftness = 0.3; // 30% of radius for fade
    float fadeStart = radius * (1.0 - edgeSoftness);
    float alpha = 1.0 - smoothstep(fadeStart, radius, dist);

    if (alpha > 0.01) {
        vec4 color;
        mainImage(color, fragCoord);
        gl_FragColor = vec4(color.rgb, color.a * alpha);
    } else {
        discard;
    }
}
`;

// Shader 2: Ether - 파랑색 (Blue - Evaluator B)
export const etherBlue = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform bool isActive;
varying vec2 vTextureCoord;

#define t iTime
mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}
float map(vec3 p){
    p.xz*= m(t*0.4);p.xy*= m(t*0.3);
    vec3 q = p*2.+t;
    return length(p+vec3(sin(t*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = fragCoord.xy/min(iResolution.x, iResolution.y) - vec2(.9, .5);
    p.x += 0.4;

    vec3 cl = vec3(0.);
    float d = 2.5;

    for(int i=0; i<=5; i++) {
        vec3 p3d = vec3(0,0,5.) + normalize(vec3(p, -1.))*d;
        float rz = map(p3d);
        float f = clamp((rz - map(p3d+.1))*0.5, -.1, 1.);

        // 파랑색 (Blue/Indigo) 색상
        vec3 baseColor;
        if(isActive) {
            baseColor = vec3(0.1, 0.15, 0.4) + vec3(2.0, 3.0, 5.0)*f;
        } else {
            baseColor = vec3(0.05, 0.1, 0.3) + vec3(1.5, 2.5, 4.0)*f;
        }

        cl = cl*baseColor + smoothstep(2.5, .0, rz)*.7*baseColor;
        d += min(rz, 1.);
    }

    fragColor = vec4(cl, 1.0);
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;

    vec2 center = iResolution * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;

    // Soft edge fade - starts fading at 70% of radius
    float edgeSoftness = 0.3; // 30% of radius for fade
    float fadeStart = radius * (1.0 - edgeSoftness);
    float alpha = 1.0 - smoothstep(fadeStart, radius, dist);

    if (alpha > 0.01) {
        vec4 color;
        mainImage(color, fragCoord);
        gl_FragColor = vec4(color.rgb, color.a * alpha);
    } else {
        discard;
    }
}
`;

// Shader 3: Ether - 핑크색 (Pink - Evaluator C)
export const etherPink = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform bool isActive;
varying vec2 vTextureCoord;

#define t iTime
mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}
float map(vec3 p){
    p.xz*= m(t*0.4);p.xy*= m(t*0.3);
    vec3 q = p*2.+t;
    return length(p+vec3(sin(t*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = fragCoord.xy/min(iResolution.x, iResolution.y) - vec2(.9, .5);
    p.x += 0.4;

    vec3 cl = vec3(0.);
    float d = 2.5;

    for(int i=0; i<=5; i++) {
        vec3 p3d = vec3(0,0,5.) + normalize(vec3(p, -1.))*d;
        float rz = map(p3d);
        float f = clamp((rz - map(p3d+.1))*0.5, -.1, 1.);

        // 핑크색 (Pink) 색상
        vec3 baseColor;
        if(isActive) {
            baseColor = vec3(0.4, 0.1, 0.25) + vec3(5.0, 1.5, 3.5)*f;
        } else {
            baseColor = vec3(0.3, 0.05, 0.2) + vec3(4.0, 1.0, 3.0)*f;
        }

        cl = cl*baseColor + smoothstep(2.5, .0, rz)*.7*baseColor;
        d += min(rz, 1.);
    }

    fragColor = vec4(cl, 1.0);
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;

    vec2 center = iResolution * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;

    // Soft edge fade - starts fading at 70% of radius
    float edgeSoftness = 0.3; // 30% of radius for fade
    float fadeStart = radius * (1.0 - edgeSoftness);
    float alpha = 1.0 - smoothstep(fadeStart, radius, dist);

    if (alpha > 0.01) {
        vec4 color;
        mainImage(color, fragCoord);
        gl_FragColor = vec4(color.rgb, color.a * alpha);
    } else {
        discard;
    }
}
`;

// Common vertex shader
export const vertexShader = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;
void main() {
  gl_Position = aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;

// Shader collection - All using Ether with different colors
export const shaders = [
  {
    id: 1,
    name: "Ether Purple",
    fragmentShader: etherPurple,
    color: "#8b5cf6" // 보라색 (Purple)
  },
  {
    id: 2,
    name: "Ether Blue",
    fragmentShader: etherBlue,
    color: "#6366f1" // 파랑/남색 (Blue/Indigo)
  },
  {
    id: 3,
    name: "Ether Pink",
    fragmentShader: etherPink,
    color: "#ec4899" // 핑크색 (Pink)
  }
];
