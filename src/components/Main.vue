<template>
  <div class="main-container">
    <Map/>
  </div>
</template>

<script>
import Map from './Map.vue'

export default {
  name: 'Main',
  components: {
    Map,
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main-container{
  
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
