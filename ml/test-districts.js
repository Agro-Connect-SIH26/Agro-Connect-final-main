const mongoose = require("mongoose");
const MarketPrice = require("./backend-node/src/models/MarketPrice");

mongoose.connect("mongodb://127.0.0.1:27017/agroconnect").then(async () => {
  const distinctDistricts = await MarketPrice.distinct("district", {
    cropName: "Onion",
    state: "Maharashtra"
  });
  console.log("Districts for Onion/Maharashtra (including empty):", distinctDistricts);
  
  const sample = await MarketPrice.findOne({ cropName: "Onion", state: "Maharashtra" });
  console.log("Sample document for Onion/Maharashtra:", JSON.stringify(sample, null, 2));
  
  process.exit();
}).catch(e => {
  console.error("Error", e);
  process.exit(1);
});
