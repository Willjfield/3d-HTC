<template>
<div>
    <div id="l-map"></div>
</div>
</template>
<script>
import L from 'leaflet';
import glify from 'leaflet.glify';

export default {
  
  name: 'lMap',
  components: {
    //Map,
  },
  data: function(){
        return{
        map:null,
        CDLayer:[],
        stateShapes: null,
        activeState:0
        }
    },
  mounted: function(){
    this.map = L.map('l-map',{
      fadeAnimation: true,
      zoomAnimation: false
      }).setView([40, -98], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(this.map);

    this.map.createPane("states").style.zIndex = 350; // between tiles and overlays

    this.loadStates();
   // this.loadDistrict(34,7);
  },
  methods: {
    async getGeoJSON(_state,_district){
      let _shapeData = await fetch(`http://localhost:3000/data/${_state}/${_district}`);
      let shapeData= await _shapeData.json();
      return shapeData
    },
    async loadStates(_state){
      let _shapeData = await fetch('../gz_2010_us_040_00_20m.json');
      let states = await _shapeData.json();
      
      let self = this;

      this.stateShapes = L.geoJSON(states,{
        style:self.stateStyle,
        pane: "states"
        }).addTo(this.map);
    },
    stateStyle: function(feature) {
              let _style = {
                color: "#000",
                fillColor: "#fff",
                fill: false,
                stroke: false,
                opacity:1,
                fillOpacity: .4
              }
              if (feature.properties.STATE === this.activeState.toString()) {
                  _style.fill = true;
                  _style.stroke = true;
              }
              return _style;
          },
    async loadDistrict(_state,_district){
      this.activeState = _state;
      this.stateShapes.setStyle(this.stateStyle);

      let self = this;

      this.stateShapes.eachLayer(function(layer){
        if(layer.feature.properties.STATE === self.activeState.toString()){
          
          self.map.fitBounds(layer.getBounds());
        }
      })

      if(!_state || !_district || _district < 1) return;
      
      
      let _data = await this.getGeoJSON(_state,_district);
      if(!_data || _data.length < 1) return;

      if(this.CDLayer && this.CDLayer.length > 0){   
        for(let layer of this.CDLayer){
          layer.remove();
        }

        this.CDLayer = [];
      }

      let _map = this.map;

      for(let row of _data){
        this.CDLayer.push(glify.shapes({
                map:_map,
                data: row,
                opacity: .2,
                border: true,
                color: () => {
                  return{
                  r:(row.congress-79)/35,
                  g:1-((row.congress-79)/35),
                  b:Math.pow(((row.congress-79)/35),2)
                  }
                }
        }))
      }
      
    },
    updateState: function(){
      //this.map.setView(<LatLng> center, <Number> zoom, <Zoom/pan options> options?)
    }
  }
}
</script>
<style src='leaflet/dist/leaflet.css'>
    /* global styles */
</style> 
<style>
html, body {
            height: 100%;
            padding: 0;
            margin: 0;
            background: rgb(14, 21, 30);
        }
        #l-map {
            position: absolute;
            height: 100%;
            width: 100%;
            background-color: #fff;
                z-index: 0;
        }
</style>