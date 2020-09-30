import mapboxgl from 'mapbox-gl';
import tp from 'tesspathy';
import * as THREE from 'three';

const GeoType = {
    MultiPolygon:"MultiPolygon",
    MultiLineString: "MultiLineString",
    MultiPoint: "MultiPoint",
    Polygon: "Polygon",
    LineString: "LineString",
    Point: "Point"
}

///add to constructor: bounding box, coords, material, id, map
export default class JsonLayer {
    type = 'custom';
    renderingMode = '3d';

    constructor(args) {
        if(!args.map){
            console.error('You need to supply a map to the layer'); 
            return;
        }

        if(!args.json){
            console.error('You need to supply json to the layer');
            return;
        }

        this.map = args.map;

        this.json = args.json;
        
        this.coords = this.json.features[0].geometry.coordinates.flat(1);
        
        this.geotype = this.json.features[0].geometry.type;

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
        let geometry;
        switch(this.geotype){
            case GeoType.LineString: case GeoType.Polygon: case GeoType.Point:
                geometry = await this.processSingle(this.coords, this.boundingBox);
                break;
            case GeoType.MultiLineString: case GeoType.MultiPolygon: case GeoType.MultiPoint: default:
                geometry = await this.processMulti(this.coords, this.boundingBox); 
                break;
        }

        var mesh = new THREE.Mesh( geometry, this.material );
        
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
         }
    }


    async processMulti(coords, _boundingBox){

        let shapes =  [];
        let labels = [];
        
        //go through each shape
        for(let i = 0; i<coords.length;i+=2){
            labels.push([tp.PATH_START]);
            //go through each x,y in each shape (increment every other +1)
            for(let j=0; j<coords[i].length;j+=2){
                let mercCoords = mapboxgl.MercatorCoordinate.fromLngLat({
                            lng: parseFloat(coords[i][j][0]).toFixed(3),
                            lat: parseFloat(coords[i][j][1]).toFixed(3)
                        });
                        
                shapes.push(
                    [mercCoords.x,
                    mercCoords.y]
                );
                }

            for(let k=1;k<(coords[i].length/2);k++){
                labels.push([tp.PATH_ANCHOR]);
            }

        }

        let mTriangleRecords = tp.triangulate(shapes, labels);
        
        let verts = {
            points: Float32Array.from( mTriangleRecords.triangleLocations),
            index: mTriangleRecords.triangleIndices
        }

        let _geometry = new THREE.BufferGeometry();

       _geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(verts.points, 2));

        _geometry.setAttribute(
            'uv',
            new THREE.BufferAttribute(verts.points, 2));

        _geometry.setIndex(verts.index);

        return _geometry;
    }

    async processSingle(coords, _boundingBox){
        let shapes =  [];

        coords = this.coords = this.coords.flat(Infinity);

        for(let i = 0; i<coords.length;i+=2){
                let point = new mapboxgl.LngLat(parseFloat(coords[i]), parseFloat(coords[i+1])); 
                let mercCoords = mapboxgl.MercatorCoordinate.fromLngLat(point);
                    shapes.push(new THREE.Vector2(
                        mercCoords.x,
                        mercCoords.y
                        )
                    );
                
        }

        let threeShape = new THREE.Shape(shapes);
        let _geometry = new THREE.ShapeGeometry(threeShape);

       

        return _geometry;
    }

                
    //Test if point is in a bounding box (not used yet)
    inBounds(box, latlng){
        return latlng.lng < box.se.lng
            && latlng.lat > box.se.lat
            && latlng.lng > box.nw.lng
            && latlng.lat < box.nw.lat
    }

}
