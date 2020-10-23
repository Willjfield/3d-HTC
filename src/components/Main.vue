<template>
  <div class="main-container">
    <v-autocomplete v-model="selectedState"
                                        :items="stateList"
                                        label="Select a state"
                                        class="select-state"
                                        solo></v-autocomplete>
      <v-text-field
      v-model="districtNumber"
      hide-details
      single-line
      min="0"
      type="number"
      class="select-district"
    />
    <lMap ref="leafletMap" class="l-map"/>
  </div>
</template>

<script>
//import Map from './Map.vue'
import lMap from './lMap.vue'
import stateList from '../StateList';
import _ from 'underscore';

export default {
  name: 'Main',
  components: {
    //Map,
    lMap
  },
  data: function(){
    return{
      selectedState:null,
      districtNumber:0,
      stateList: stateList
    }
  },
  watch:{
    selectedState: function (val) {
      _.throttle(this.$refs.leafletMap.loadDistrict(this.selectedState,this.districtNumber),300);
    },
    districtNumber: function (val) {
      _.throttle(this.$refs.leafletMap.loadDistrict(this.selectedState,this.districtNumber),300);
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main-container{
  
}
.select-state{
      width: 20%;
    position: absolute;
    left: 50px;
    top: 12px;
    display: inline-block;
    height: 50px;
    z-index: 1;
}

.select-district{
      width: 4%;
    position: absolute;
    margin-left: 60px;
    margin-top: 0px;
    left: 20%;
    height: 50px;
    z-index: 1;
    top: 12px;
    padding: 5px;
    border-radius: 5px;
    background: white;
}

.l-map{
  z-index: 0;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
