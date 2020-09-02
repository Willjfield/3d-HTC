<template>
    <div id="map"></div>
</template>
<script>
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
 //import {ScatterplotLayer} from '@deck.gl/layers';
import {MapboxLayer} from '@deck.gl/mapbox';
import {HexagonLayer} from '@deck.gl/aggregation-layers';
import {SolidPolygonLayer} from '@deck.gl/layers';
import fetch from 'node-fetch';

// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com

export default {
    name: 'Map',
    data: function(){
        return{
        map:null
        }
    },
    mounted: function(){
        
        mapboxgl.accessToken = 'pk.eyJ1IjoiY3VueWN1ciIsImEiOiJfQmNSMF9NIn0.uRgbcFeJbw2xyTUZY8gYeA';
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            zoom: 4,
            center: [-95.5, 37],
            pitch: 45,
            antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
        });

        this.addData();
    },
    methods:{
        colorFromValue: function (_colors, _thresholds, value) {
                let _color;
                for (var c = 0; c < _thresholds.length; c++) {
                    if (value <= _thresholds[c]) _color = _colors[c];
                }

                return _color;
        },
        addData: async function(){
               // let state_resp = await fetch('censushardtocountmaps2020.us/api/rtr/states');
               let state_resp = await fetch('./state_rates.json');
                let _data = await state_resp.json();

                let state_centroid_resp = await fetch('us-state-centroids.json');
                let state_data = await state_centroid_resp.json();
                let state_centroids = state_data.features;

                let self = this;

                for (const state of _data) {
                    let stateMatch = state_centroids.filter(s => s.id === state.geoid)[0];
                    state.coordinates = stateMatch.geometry.coordinates;
                }


                    const totalprimlayer = new MapboxLayer({
                        id: 'prim-layer-total',
                        type: SolidPolygonLayer,
                        data: _data,
                        pickable: true,
                        extruded: true,
                        elevationScale: 10000,
                        elevationDomain: [0,100],
                        getPolygon: (d)=>{
                            let box = [
                                [-.25, -.25], 
                                [-.25, .25], 
                                [.25, .25], 
                                [.25, -.25], 
                                [-.25, -.25]
                            ];

                            return box.map((c) => {
                                c[0]+=d.coordinates[0];
                                c[1]+=d.coordinates[1];
                                return(c)
                            });
                        },
                        getElevation:(d) => {
                            return d.totalRate
                        },
                        getFillColor: (d) => {
                            //const thresholds = [1, .85, .74, .68, .62, .56, .5, .4, .3, .15, 0];
                            //const colors=[[12,43,133],[34,94,168],[29,145,191],[126,204,186],[198,232,179]]
                            const thresholds = [1, .9, .8, .7, .6];
                            const colors= [[37,52,148],[65,182,196],[161,218,180],[255,255,204]]
                            return self.colorFromValue(colors, thresholds, d.totalRate/100)
                        },
                    });

                    const totalleftlayer = new MapboxLayer({
                        id: 'prim-layer-total-left',
                        type: SolidPolygonLayer,
                        data: _data,
                        pickable: true,
                        extruded: true,
                        elevationScale: 10000,
                        elevationDomain: [0,100],
                        wireframe: true,
                        filled: false,
                        getPolygon: (d)=>{
                            let box = [
                                [-.35, -.35], 
                                [-.35, .35], 
                                [.35, .35], 
                                [.35, -.35], 
                                [-.35, -.35]
                            ];

                            return box.map((c) => {
                                c[0]+=d.coordinates[0];
                                c[1]+=d.coordinates[1];
                                return(c)
                            });
                        },
                        getElevation:(d) => {
                            return 100
                        },
                        getLineColor: (d) => {
                            return [255,255,255, 64]
                        },
                        getFillColor: (d) => {
                            return [255,255,255,16]
                        },
                    });

                    const sRLatestprimlayer = new MapboxLayer({
                        id: 'srprim-layer-total',
                        type: SolidPolygonLayer,
                        data: _data,
                        pickable: true,
                        extruded: true,
                        elevationScale: 10000,
                        elevationDomain: [0,100],
                        getPolygon: (d)=>{
                            let box = [
                                [-.35, -.35], 
                                [-.35, .35], 
                                [.35, .35], 
                                [.35, -.35], 
                                [-.35, -.35]
                            ];

                            return box.map((c) => {
                                c[0]+=d.coordinates[0];
                                c[1]+=d.coordinates[1];
                                return(c)
                            });
                        },
                        getElevation:(d) => {
                            return d.sR2020latest*100
                        },
                        getFillColor: (d) => {
                            const thresholds = [1, .85, .74, .68, .62, .56, .5, .4, .3, .15, 0];
                           
                            const colors= [
                                [179,88,6],
                                [17,46,81],
                                [49,54,149],
                                [69,117,180],
                                [116,173,209],
                                [171,217,233],
                                [224,243,248],
                                [254,224,144],
                                [253,184,99],
                                [224,130,20],
                            ];
                            return self.colorFromValue(colors, thresholds, d.sR2020latest)
                        },
                    });
                    

                    this.map.on('load', () => {
                        this.map.addLayer(totalleftlayer);
                        this.map.addLayer(totalprimlayer);
                        this.map.addLayer(sRLatestprimlayer);
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