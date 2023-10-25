
attribute vec4 coordinates;
    attribute vec2 textureCoord;  // Add this line
    varying highp vec2 vTextureCoord;  // Add this line

    void main(void) {
        gl_Position = coordinates;
        vTextureCoord = textureCoord;  // Add this line
    }