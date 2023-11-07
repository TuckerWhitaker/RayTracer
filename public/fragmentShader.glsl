precision mediump float;
uniform float u_time;

struct Material {
    vec3 color;
    float roughness;
    float metallic;
    vec3 emission;
};

struct Sphere { 
    vec3 center;
    float radius;
    Material material;
};

struct HitInfo {
    bool hit;
    float distance;
    vec3 sphereCenter;
    vec3 color;
    float roughness;
    float metallic;
    vec3 emission;
    vec3 normal;
};

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233 * u_time))) * 43758.5453123);
}

vec3 calculateHitPosition(vec3 rayOrigin, vec3 rayDirection, float dist){
    return(rayOrigin + (rayDirection * dist));
}

vec3 calculateTriangleNormal(vec3 v0, vec3 v1, vec3 v2) {
    vec3 edge1 = v1 - v0;
    vec3 edge2 = v2 - v0;
    vec3 normal = normalize(cross(edge1, edge2));
    return normal;
}
vec3 calculateNormal(vec3 rayOrigin, vec3 rayDirection, float dist, vec3 sphereCenter){
    return normalize((calculateHitPosition(rayOrigin, rayDirection, dist) - sphereCenter));
}

const int numSpheres = 5;
Sphere spheres[numSpheres];
Material materials[numSpheres];

bool IntersectRaySphere(vec3 rayOrigin, vec3 rayDirection, Sphere sphere, out float t) {
    vec3 oc = rayOrigin - sphere.center;
    float a = dot(rayDirection, rayDirection);
    float b = 2.0 * dot(oc, rayDirection);
    float c = dot(oc, oc) - sphere.radius * sphere.radius;
    float discriminant = b*b - 4.0*a*c;

    if (discriminant < 0.0) {
        return false;
    } else {
        float sqrtDiscriminant = sqrt(discriminant);
        float t0 = (-b - sqrtDiscriminant) / (2.0*a);
        float t1 = (-b + sqrtDiscriminant) / (2.0*a);
        if(t0 > 0.0 && t1 > 0.0) t = min(t0, t1);
        else if(t0 > 0.0) t = t0;
        else if(t1 > 0.0) t = t1;
        else return false;
        return true;
    }
}


bool IntersectRayTriangle(vec3 rayOrigin, vec3 rayDirection, vec3 v0, vec3 v1, vec3 v2, out float t) {
    vec3 edge1 = v1 - v0;
    vec3 edge2 = v2 - v0;
    vec3 h = cross(rayDirection, edge2);
    float a = dot(edge1, h);

    if (a > -0.00001 && a < 0.00001)
        return false;

    float f = 1.0/a;
    vec3 s = rayOrigin - v0;
    float u = f * dot(s, h);

    if (u < 0.0 || u > 1.0)
        return false;

    vec3 q = cross(s, edge1);
    float v = f * dot(rayDirection, q);

    if (v < 0.0 || u + v > 1.0)
        return false;

    t = f * dot(edge2, q);
    if (t > 0.001)
        return true;

    return false;
}

HitInfo castRay(vec3 rayOrigin, vec3 rayDirection) {
    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.distance = 999999.0;
    float t;
    for (int i = 0; i < numSpheres; ++i) {
    if (IntersectRaySphere(rayOrigin, rayDirection, spheres[i], t)) {
        if (t < closestHit.distance) {
            closestHit.hit = true;
            closestHit.distance = t;
            closestHit.sphereCenter = spheres[i].center;
            closestHit.color = spheres[i].material.color;
            closestHit.roughness = spheres[i].material.roughness;
            closestHit.metallic = spheres[i].material.metallic;
            closestHit.emission = spheres[i].material.emission;
            closestHit.normal = calculateNormal(rayOrigin, rayDirection, t, spheres[i].center);
        }
    }
}
    
    return closestHit;
}

const int maxBounces = 10;
vec3 skyColor = vec3(0.7, 0.7, 0.9);
//vec3 skyColor = vec3(0.0, 0.0, 0.0);

vec3 calculateReflectionRay(vec3 rayDirection, vec3 normal) {
    return rayDirection - 2.0 * dot(rayDirection, normal) * normal;
}

//5 spheres
uniform vec3 u_SpherePosition0;
uniform vec3 u_SpherePosition1;
uniform vec3 u_SpherePosition2;
uniform vec3 u_SpherePosition3;
uniform vec3 u_SpherePosition4;

uniform float u_SphereScale0;
uniform float u_SphereScale1;
uniform float u_SphereScale2;
uniform float u_SphereScale3;
uniform float u_SphereScale4;

uniform vec3 u_MaterialColor0;
uniform vec3 u_MaterialColor1;
uniform vec3 u_MaterialColor2;
uniform vec3 u_MaterialColor3;
uniform vec3 u_MaterialColor4;

uniform float u_MaterialRoughness0;
uniform float u_MaterialRoughness1;
uniform float u_MaterialRoughness2;
uniform float u_MaterialRoughness3;
uniform float u_MaterialRoughness4;

uniform vec3 u_MaterialEmission0;
uniform vec3 u_MaterialEmission1;
uniform vec3 u_MaterialEmission2;
uniform vec3 u_MaterialEmission3;
uniform vec3 u_MaterialEmission4;

uniform float u_TrianglesArray[108];
uniform float u_NormalsArray[18];

struct Triangle {
    vec3 v0;
    vec3 v1;
    vec3 v2;
};



bool IntersectRayTriangle(vec3 rayOrigin, vec3 rayDirection, Triangle triangle, out float t, out vec3 hitNormal) {
    const float EPSILON = 0.000001;
    vec3 edge1, edge2, h, s, q;
    float a, f, u, v;

    edge1 = triangle.v1 - triangle.v0;
    edge2 = triangle.v2 - triangle.v0;
    h = cross(rayDirection, edge2);
    a = dot(edge1, h);
    
    if (a > -EPSILON && a < EPSILON) {
        return false; // This ray is parallel to this triangle.
    }
    
    f = 1.0 / a;
    s = rayOrigin - triangle.v0;
    u = f * dot(s, h);
    
    if (u < 0.0 || u > 1.0) {
        return false;
    }
    
    q = cross(s, edge1);
    v = f * dot(rayDirection, q);
    
    if (v < 0.0 || u + v > 1.0) {
        return false;
    }
    
    // At this stage we can compute t to find out where the intersection point is on the line.
    t = f * dot(edge2, q);
    
    if (t > EPSILON) { // ray intersection
        hitNormal = cross(edge1, edge2);
        hitNormal = normalize(hitNormal);
        return true;
    }
    
    return false; // This means that there is a line intersection but not a ray intersection.
}


Material TriangleMaterial = Material(vec3(1.0, 0.0, 1.0), 0.7, 0.0, vec3(0.0, 0.0, 0.0));  

HitInfo IntersectRayTriangles(vec3 rayOrigin, vec3 rayDirection, Triangle triangles[36]) {

    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.distance = 999999.0; // Initialize with a far away distance
    float t;
    vec3 hitNormal;

    for (int i = 0; i < 36; ++i) {
        if (IntersectRayTriangle(rayOrigin, rayDirection, triangles[i], t, hitNormal)) {
            if (t < closestHit.distance) {
                closestHit.hit = true;
                closestHit.distance = t;
                closestHit.normal = vec3(u_NormalsArray[i],u_NormalsArray[i + 1], u_NormalsArray[i + 2]);
                closestHit.color = TriangleMaterial.color;
                closestHit.roughness = TriangleMaterial.roughness;
                closestHit.metallic = TriangleMaterial.metallic;
                closestHit.emission = TriangleMaterial.emission;
            }
        }
    }
    
    return closestHit;
}


void main(void) {
    vec2 resolution = vec2(900.0, 900.0);
    vec2 uv = (gl_FragCoord.xy / resolution - 0.5) * 2.0;
    uv.x *= resolution.x / resolution.y;

    vec3 rayOrigin = vec3(0.0, 0.0, 4.0);
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    materials[0] = Material(u_MaterialColor0, u_MaterialRoughness0, 0.0, u_MaterialEmission0);  
    materials[1] = Material(u_MaterialColor1, u_MaterialRoughness1, 0.0, u_MaterialEmission1);  
    materials[2] = Material(u_MaterialColor2, u_MaterialRoughness2, 0.0, u_MaterialEmission2);  
    materials[3] = Material(u_MaterialColor3, u_MaterialRoughness3, 0.0, u_MaterialEmission3);  
    materials[4] = Material(u_MaterialColor4, u_MaterialRoughness4, 0.0, u_MaterialEmission4);  



    spheres[0] = Sphere(u_SpherePosition0, u_SphereScale0, materials[0]);
    spheres[1] = Sphere(u_SpherePosition1, u_SphereScale1, materials[1]);
    spheres[2] = Sphere(u_SpherePosition2, u_SphereScale2, materials[2]);
    spheres[3] = Sphere(u_SpherePosition3, u_SphereScale3, materials[3]);
    spheres[4] = Sphere(u_SpherePosition4, u_SphereScale4, materials[4]);


    //u_TrianglesArray
    Triangle triangles[36];
    for(int a = 0; a < 100; a += 3){
        triangles[a/3].v0 = vec3(u_TrianglesArray[a], u_TrianglesArray[a + 1], u_TrianglesArray[a + 2]);
        triangles[a/3].v1 = vec3(u_TrianglesArray[a + 3], u_TrianglesArray[a + 4], u_TrianglesArray[a + 5]);
        triangles[a/3].v2 = vec3(u_TrianglesArray[a + 6], u_TrianglesArray[a + 7], u_TrianglesArray[a + 8]);
    }

    vec3 accumulatedColor = vec3(0.0);
    vec3 reflectionMultiplier = vec3(1.0);  // Initialize reflection multiplier to 1

    for (int bounce = 0; bounce < maxBounces; ++bounce) {

        HitInfo sphereHit = castRay(rayOrigin, rayDirection);
        HitInfo triangleHit = IntersectRayTriangles(rayOrigin, rayDirection, triangles);


        HitInfo closestHit;
        closestHit.hit = false;


        if (sphereHit.hit && sphereHit.distance < triangleHit.distance) {
            closestHit = sphereHit;
        } else if (triangleHit.hit) {
            closestHit = triangleHit;
        } else {
            closestHit.hit = false;
        }

        if (closestHit.hit) {
            vec3 hitPosition = calculateHitPosition(rayOrigin, rayDirection, closestHit.distance);
            vec3 normal = closestHit.normal;
            vec3 localColor = closestHit.color;  

            accumulatedColor += (reflectionMultiplier * localColor * closestHit.emission * 10.0);  
            //accumulatedColor += closestHit.emission * 10.0;
            reflectionMultiplier *= localColor;
           
            rayOrigin = hitPosition + normal * 0.001;
            vec3 randomVector = vec3(
                    (random(gl_FragCoord.xy + vec2(0.0, 0.0))*2.0)-1.0,
                    (random(gl_FragCoord.xy + vec2(12.99, 78.23))*2.0)-1.0,
                    (random(gl_FragCoord.xy + vec2(24.53, 9.49))*2.0)-1.0
            );

            rayDirection = mix(normal, normalize(randomVector), closestHit.roughness);
        } 
        else
        {
            accumulatedColor += reflectionMultiplier * skyColor;  // Modulate sky color by reflectionMultiplier
            reflectionMultiplier *= 0.0;

        }
}
    accumulatedColor = sqrt(accumulatedColor);
    accumulatedColor = accumulatedColor/1000.0;
    gl_FragColor = vec4(accumulatedColor, 1.0);
}