#include <stdlib.h>
#include <stdbool.h>
#include <math.h>

typedef struct {
    double x, y, z;
} Vector3;

typedef struct {
    Vector3 origin;
    Vector3 direction;
} Ray;

typedef struct {
    Vector3 center;
    double radius;
    Vector3 color;
} Sphere;

double dot(Vector3 a, Vector3 b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

Vector3 computeNormal(Vector3 intersectionPoint, Sphere sphere) {
    Vector3 normal = {
        intersectionPoint.x - sphere.center.x,
        intersectionPoint.y - sphere.center.y,
        intersectionPoint.z - sphere.center.z
    };

    // Normalize the vector
    double length = sqrt(dot(normal, normal));
    return (Vector3){normal.x / length, normal.y / length, normal.z / length};
}

Vector3 calculateColor(Vector3 normal, Vector3 lightDirection, Vector3 color) {
    double intensity = fmax(0, dot(normal, lightDirection)); // Clamp negative values to zero
    return (Vector3){color.x * intensity, color.y * intensity, color.z * intensity};
}

bool intersectRaySphere(Ray ray, Sphere sphere, double* t) {
    Vector3 oc = {
        ray.origin.x - sphere.center.x,
        ray.origin.y - sphere.center.y,
        ray.origin.z - sphere.center.z
    };

    double a = dot(ray.direction, ray.direction);
    double b = 2.0 * dot(oc, ray.direction);
    double c = dot(oc, oc) - sphere.radius * sphere.radius;

    double discriminant = b*b - 4*a*c;

    if (discriminant < 0) {
        return false;
    } else {
        *t = (-b - sqrt(discriminant)) / (2.0*a);
        if (*t < 0) {
            *t = (-b + sqrt(discriminant)) / (2.0*a);
            if (*t < 0) return false;
        }
        return true;
    }
}

Vector3 getColorForRay(Ray ray, Sphere *spheres, Vector3 lightDirection) {
    double t;
    //size_t size = sizeof(spheres) / sizeof(spheres[0]);

    int lowest = 9999999;
    int lowestIndex = -1;
    for(int i = 0; i < 2; i++){

        if (intersectRaySphere(ray, spheres[i], &t)) {
            if(t < lowest){
                lowest = t;
                lowestIndex = i;
            }
        }
    }

    if(lowestIndex != -1){

        Vector3 intersectionPoint = {
            ray.origin.x + lowest * ray.direction.x,
            ray.origin.y + lowest * ray.direction.y,
            ray.origin.z + lowest * ray.direction.z
        };
        Vector3 normal = computeNormal(intersectionPoint, spheres[lowestIndex]);
        return calculateColor(normal, lightDirection, spheres[lowestIndex].color);
    }
    else{
        return (Vector3){120, 120, 255}; // default color
    }
    
}

int* createArray(int width, int height, bool useSampling, float scale) {
    const int samplesPerPixel = 10;
    int* arr = (int*)malloc(width * height * 3 * sizeof(int));
    Vector3 lightDirection = {-1, -1, -1};
    Sphere sphere = {{0, 0, 0}, scale, {255, 0, 255}};
    Sphere sphere1 = {{1.5, 0, 0}, 0.5, {255, 100, 100}};
    Sphere spheres[2] = {sphere, sphere1};
    
    // Normalize light direction
    double length = sqrt(dot(lightDirection, lightDirection));
    lightDirection = (Vector3){lightDirection.x / length, lightDirection.y / length, lightDirection.z / length};

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            Vector3 accumulatedColor = {0, 0, 0};
            int samples = useSampling ? samplesPerPixel : 1;

            for (int sample = 0; sample < samples; sample++) {
                double offsetX = useSampling ? (rand() / (double)RAND_MAX) : 0;
                double offsetY = useSampling ? (rand() / (double)RAND_MAX) : 0;
                double u = (2.0 * (x + offsetX) - width) / width;
                double v = (2.0 * (y + offsetY) - height) / height;
                Ray ray = {{0, 0, -3}, {u, v, 1}};
                
                Vector3 color = getColorForRay(ray, spheres, lightDirection);
                accumulatedColor.x += color.x;
                accumulatedColor.y += color.y;
                accumulatedColor.z += color.z;
            }
            
            accumulatedColor.x /= samples;
            accumulatedColor.y /= samples;
            accumulatedColor.z /= samples;

            int index = (y * width + x) * 3;
            arr[index] = accumulatedColor.x;
            arr[index + 1] = accumulatedColor.y;
            arr[index + 2] = accumulatedColor.z;
        }
    }
    return arr;
}
