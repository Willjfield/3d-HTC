//Dependent on Mapbox, tesspathy, and threejs
import mapboxgl from 'mapbox-gl';
import tp from 'tesspathy';
import * as THREE from 'three';

//Using an enum rather than retyping strings repeatedly reduces chances of typos
const GeoType = {
    MultiPolygon:"MultiPolygon",
    MultiLineString: "MultiLineString",
    MultiPoint: "MultiPoint",
    Polygon: "Polygon",
    LineString: "LineString",
    Point: "Point"
}

export default class JsonLayer {
    //https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/
    type = 'custom';
    renderingMode = '3d';

    constructor(args) {

        //The class ultimately needs one feature. It can get this by assuming the first feature in the GeoJson OR you can supply a feature. If you supply neither or both, it should give the user an error
        if(!(args.json ? !args.feature : args.feature)){
            console.error('You need to supply EITHER json OR a feature to the layer but NOT both');
            return;
        }

        //Set object instance properties from the argument object
        this.json = args.json;

        this.feature = this.json ? this.json.features[0] : args.feature;
        
        this.coords = this.feature.geometry.coordinates.flat(1);
        
        this.geotype = this.feature.geometry.type;

        this.id = args.id || 'jsonlayer';

        this.zOffset = args.zOffset || 0;

        this.boundingBox = args.boundingBox;

        //Default ThreeJS material, scene, and camera if you don't pass one in
        this.material = args.material || new THREE.MeshPhongMaterial( { side: THREE.DoubleSide,color:0xffffff } );
        this.scene = args.scene || new THREE.Scene();
        this.camera = args.camera || new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);

        //This will be called each time the layer renders. Useful for updating uniforms
        this.onRender = args.onRender || function(){};
    }

    //Triggered when you call map.add(...)
    async onAdd(map, gl) {
        
        //Reset the camera's transform matrix
        this.cameraTransform = new THREE.Matrix4();
        //Tell the layer what map it's on
        this.map = map;
        //Add all the things to the scene (below)
        this.scene = await this.makeScene();

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
            alpha: true
        });

        //If true (default), the background (map base layer) gets over written on render
        this.renderer.autoClear = false;
    }

    //This creates the actual mesh and adds it tothe scene
    async makeScene() {
        //Depending on whether the feature is a multi-feature or singular, it has to be processed differently
        let geometry;
        switch(this.geotype){
            case GeoType.LineString: case GeoType.Polygon: case GeoType.Point:
                geometry = await this.processSingle(this.coords, this.boundingBox);
                break;
            case GeoType.MultiLineString: case GeoType.MultiPolygon: case GeoType.MultiPoint: default:
                geometry = await this.processMulti(this.coords, this.boundingBox); 
                break;
        }

        //This is how you add a mesh to a scene.
        var mesh = new THREE.Mesh( geometry, this.material );
        
        const group = new THREE.Group();
        group.name = '$group';

        group.add(mesh);
        this.scene.add(group);
        
        return this.scene;
    }

    //The threejs render function
    render(gl, matrix) {
         if(this.renderer && this.scene){
            //create a matrix from the context's matrix passed in from mapbox
            var m = new THREE.Matrix4().fromArray(matrix);
            //create an identity matrix
            var l = new THREE.Matrix4();
            
            //set the threejs camera's transform to match mapbox's
            this.camera.projectionMatrix = m.multiply(l);

            //trigger the onRender event
            this.onRender( matrix);

            //Reset the renderer
            this.renderer.state.reset();
           
            //Render away in threejs and repaint the map
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
         }
    }

    //Process a multipolygon/multipoint feature
    async processMulti(coords, _boundingBox){

        //Based on Tesspathy example http://gree.github.io/tesspathy/demos/drawing_pad/
        let shapes =  [];
        let labels = [];

        //go through each shape
        for(let i = 0; i<coords.length;i++){
            //First point needs to be labeled as a starting point
            labels.push([tp.PATH_START]);
            //go through each x,y in each shape (increment every other +1)
            for(let j=0; j<coords[i].length;j+=2){
                //get the lat/lng of the point
                let point = new mapboxgl.LngLat(parseFloat(coords[i][j][0]), parseFloat(coords[i][j][1]));
                //If there's no bounding box or if the point is in the bounding box
                if(!this.boundingBox || this.inBounds(this.boundingBox, point)){ 
                    //Transform the point to mercator coordinates and add to shapes array
                    let mercCoords = mapboxgl.MercatorCoordinate.fromLngLat(point);    
                    shapes.push(
                        [mercCoords.x,
                        mercCoords.y]
                    );
                    
                }
            }
            //Each of these points should be labeled an anchor
            for(let k=1;k<(coords[i].length/2);k++){
                labels.push([tp.PATH_ANCHOR]);
            }

        }

        //Use Tesspathy to tesselate the shape and get UVs
        //let mTriangleRecords = tp.triangulate(shapes, labels);
        
        //shapes.map((s)=>s.push(this.zOffset));
        

        //Make an object for each vertex with the location and index
        // let verts = {
        //     points: Float32Array.from(shapes.flat(Infinity)),
        //     uvs: Float32Array.from( mTriangleRecords.triangleLocations),
        //     index: mTriangleRecords.triangleIndices
        // }
       
        //Create a new THREE.BufferGeometry
        let _geometry = new THREE.BufferGeometry();

        //Set the position attribute to the point location
       _geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(verts.points, 2));

        //Set the uv coordinate to the point location (This only works because it's a flat surface with 0-1 coordinates!)
        _geometry.setAttribute(
            'uv',
            new THREE.BufferAttribute(verts.uvs, 2));

        //Set the order to draw the vertices in
        _geometry.setIndex(verts.index);

         return _geometry;
    }

    //Process a feature that is not a multipolygon, multipoint etc.
    async processSingle(coords, _boundingBox){
        let shapes =  [];

        //Flatten the coordinates array completely
        coords = this.coords = this.coords.flat(Infinity);

        for(let i = 0; i<coords.length;i+=2){
            //Get a lat/lng point
            let point = new mapboxgl.LngLat(parseFloat(coords[i]), parseFloat(coords[i+1])); 
            //If there's no bounding box or if the point is inside the box
            if(!this.boundingBox || this.inBounds(this.boundingBox, point)){
                //Convert the point to Mercator Coordinates
                let mercCoords = mapboxgl.MercatorCoordinate.fromLngLat(point);
                    //Create a shape with these points
                    shapes.push(new THREE.Vector2(
                        mercCoords.x,
                        mercCoords.y
                        )
                    );
            }
                
        }

        //Create and return a ShapeGeometry
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
