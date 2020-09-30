import * as THREE from 'three';

export default new THREE.ShaderMaterial( {

    uniforms: {
         iGlobalTime:    { value: 0.1 },
         cities:{ value:[]}
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
    uniform float iGlobalTime;
    uniform vec2 cities[50];
    varying vec2 vUv;

    void main(void)
    {
        
        float m = .67;
        vec2 newUv = vUv;

        for (int i = 0; i < 50; i++) {
            if(distance(vUv,cities[i]) < .002*(sin(iGlobalTime+((vUv.x+.5)*20.))+1./2.)){
                m = 0.34;
                newUv = vec2(1.-mod(vUv.x*3.,1.),mod(vUv.x*3.,1.));
            }
        }
        gl_FragColor = vec4(vec2(mod(1.-newUv*2.,1.)),0., m);
    }
    `

} );