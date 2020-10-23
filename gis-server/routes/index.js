var express = require('express');
var router = express.Router();
var fs = require('fs');



/* PostgreSQL and PostGIS module and connection setup */
const { Client, Query } = require('pg')

// Setup connection
var username = "postgres" // sandbox username
var password = "UUhkho84" // read only privileges on our table
var host = "localhost:5432"
var database = "CDDB" // database name
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database; // Your Database Connection

// Set up your database query to display GeoJSON
var cd_query = `
SELECT jsonb_build_object(
  'type',       'Feature',
  'id',         id,
  'geometry',   ST_AsGeoJSON(geom)::jsonb,
  'congress',    congress,
  'properties', to_jsonb(row) - 'geom' - 'congress'
) FROM (SELECT * FROM all_cd_districts WHERE strpos(id,'%statename%')=2 and district='%district%') row;
`
var client = new Client(conString)
client.connect();

/* GET Postgres JSON data */
router.get('/data/:state/:district', function (req, res) {
  
  var query = client.query(new Query(cd_query
    .replace('%statename%',req.params.state)
    .replace('%district%', req.params.district)));
    
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
      let rows = result.rows.map((r)=>r.jsonb_build_object)
      res.send(rows);
      res.end();
  });
});


module.exports = router;
