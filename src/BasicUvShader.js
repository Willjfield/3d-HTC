import * as THREE from 'three';

export default new THREE.ShaderMaterial( {

    uniforms: {
         iGlobalTime:    { type: 'f', value: 0.1 },
    },
    side:THREE.DoubleSide,
    vertexShader: `

    varying vec2 vUv; 
    void main()
    {
        vUv = uv;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
    }

    `,

    fragmentShader: `
    uniform vec3 color;
    varying vec2 vUv;

    void main(void)
    {
        gl_FragColor = vec4(color, .1);
    }
    `

} );