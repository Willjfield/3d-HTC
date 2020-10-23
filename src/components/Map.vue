<template>
    <div id="map"></div>
</template>
<script>
import mapboxgl from 'mapbox-gl';
import JsonLayer from '../JsonLayer';
import BasicUvShader from '../BasicUvShader';
import CityShader from '../CityShader';
import * as THREE from 'three';

//import tp from 'tesspathy';

export default {
    name: 'Map',
    data: function(){
        return{
        map:null
        }
    },
    mounted: function(){

        mapboxgl.accessToken = 'pk.eyJ1Ijoid2ZpZWxkLWN1bnkiLCJhIjoiY2p6YTJnN2lzMDB1aDNicm9qbzN6d2F5dCJ9.eOQlPpQf5uyOJANVWurDDA';
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/wfield-cuny/ckffjh8d9037a19qj16geqf27',
            center: [-90,38],
            zoom: 3,
            pitch: 0,
            antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
        });

        let self = this;
        
        this.createJsonLayer()

    },
    methods:{
        async createJsonLayer(){
            let outline114 = await fetch('../NJ_7_114.geojson');
           
            let _data114= await outline114.json();
            console.log(_data114)
            //let outline106 = await fetch('../NJ_7_106.geojson');
           let outline106= await fetch('http://localhost:3000/data');
            let _data106= await outline106.json();

         //  console.log(_data106[0])
            
            let cities = await fetch('../usa-state-capitals.geojson');
            let cityData = await cities.json();

            let cityCoords = cityData.features.map((g)=> {

                let latlng = new mapboxgl.MercatorCoordinate.fromLngLat({
                    lng: g.geometry.coordinates[0],
                    lat: g.geometry.coordinates[1]
                });
                
                return new THREE.Vector2(
                    latlng.x,
                    latlng.y
                )
            });

            const directionalLight = new THREE.SpotLight(0xffffff, 1,10,.3,1);
            directionalLight.position.set(1,1, -1);

            let camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);

            let map = this.map;

            let _jsonLayer114 = new JsonLayer({
                id:'114-json', 
                map: map, 
                camera: camera,
                json: _data114,
                zOffset: .0001
            });

             //var shaderMaterial = BasicUvShader;
            
            _jsonLayer114.material = new THREE.MeshBasicMaterial({
                transparent: true, 
                side: THREE.DoubleSide,
                opacity:.5,
                color:0xff9955,
                depthWrite: false
            });

            let _jsonLayer106 = new JsonLayer({
                id:'106-json', 
                map: map, 
                camera: camera,
                feature: _data106[0],
                zOffset: .001,
                depthWrite: false,
                scene: _jsonLayer114.scene
            });

             _jsonLayer106.material = new THREE.MeshBasicMaterial({
                transparent: true, 
                side: THREE.DoubleSide,
                opacity:.5,
                color:0x55ff99
            });
            map.on('load', function () {
               //map.addLayer(_jsonLayer114, 'waterway-label');
                map.addLayer(_jsonLayer106, 'waterway-label');
            });

            map.on('webglcontextlost', function() {
                console.log('A webglcontextlost event occurred.');
            });

        }
    }
    
    
}
</script>
<style scoped>
#map{
    position: fixed;
    top:0;
    left:0;
    width:100%;
    height:100%;
}
</style>
