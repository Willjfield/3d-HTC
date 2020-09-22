import mapboxgl from 'mapbox-gl';
//import fetch from 'node-fetch';
//import tp from 'tesspathy';
import * as THREE from 'three';


///add to constructor: bounding box, coords, material, id, map
export default class JsonLayer {
    type = 'custom';
    renderingMode = '3d';

    constructor(args) {
        if(!args.map){
            console.error('You need to supply a map to the layer'); 
            return;
        }

        if(!args.coords){
            console.error('You need to supply coordinates to the layer');
            return;
        }

        this.map = args.map;
        this.coords = args.coords;

        this.id = args.id || 'jsonlayer';
        this.boundingBox = args.boundingBox;
        this.material = args.material || new THREE.MeshPhongMaterial( { side: THREE.DoubleSide,color:0xffffff } );
        this.scene = args.scene || new THREE.Scene();
        this.camera = args.camera || new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);

        this.onRender = args.onRender || function(){};
    }

    async onAdd(map, gl) {
        
        this.cameraTransform = new THREE.Matrix4();
        this.map = map;
        this.scene = await this.makeScene();

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
        alpha: true
        });

        this.renderer.autoClear = false;
    }

    async makeScene() {
       
        const verts = await this.getVerticies(this.coords, this.boundingBox);

        const shape = new THREE.Shape( verts );
        var _geometry = new THREE.ShapeBufferGeometry( shape );

        var mesh = new THREE.Mesh( _geometry, this.material );
        
        const group = new THREE.Group();
        group.name = '$group';

        group.add(mesh);
        this.scene.add(group);
        
        return this.scene;
    }

    render(gl, matrix) {
         if(this.renderer && this.scene){
            
            var m = new THREE.Matrix4().fromArray(matrix);
            var l = new THREE.Matrix4();
            
            this.camera.projectionMatrix = m.multiply(l);
            this.onRender( matrix)
            this.renderer.state.reset();
           
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
            //
         }
    }

    async getVerticies (coords, _boundingBox){

        let shapes =  [];

        //go through each shape
        for(let i = 0; i<coords.length;i+=2){
                let point = new mapboxgl.LngLat(parseFloat(coords[i]), parseFloat(coords[i+1]));
                if((_boundingBox && this.inBounds(_boundingBox,point))||!_boundingBox){   
                let mercCoords = mapboxgl.MercatorCoordinate.fromLngLat(point);
                    shapes.push(new THREE.Vector2(
                         mercCoords.x,
                         mercCoords.y
                        )
                    );
                }
        }

        return shapes;
    }

    inBounds(box, latlng){
        return latlng.lng < box.se.lng
            && latlng.lat > box.se.lat
            && latlng.lng > box.nw.lng
            && latlng.lat < box.nw.lat
    }

}
