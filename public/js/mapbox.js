const locations = JSON.parse(document.getElementById("map").dataset.locations);

mapboxgl.accessToken =
  "pk.eyJ1Ijoia2lzaG9yYmFsZ2kiLCJhIjoiY2t6amt1ZWp6MXluazMycGRkMGZ1aW9pZSJ9.vZScv8fQPRCsWCSvEGZ1eA";
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
});
