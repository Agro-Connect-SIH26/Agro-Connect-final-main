const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agroconnect');
  console.log('Connected to DB');

  const MarketPrice = mongoose.model('MarketPrice', new mongoose.Schema({}, { strict: false, collection: 'marketprices' }));

  const total = await MarketPrice.countDocuments();
  console.log('A. Total MarketPrice document count:', total);

  const bySource = await MarketPrice.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
  console.log('B. Count by source:', bySource);

  const byCrop = await MarketPrice.aggregate([{ $group: { _id: '$cropName', count: { $sum: 1 } } }]);
  console.log('C. Count by crop:', byCrop);

  const byState = await MarketPrice.aggregate([{ $group: { _id: '$state', count: { $sum: 1 } } }]);
  console.log('D. Count by state:', byState);

  const byYear = await MarketPrice.aggregate([
    { $group: { _id: { $year: { $dateFromString: { dateString: "$arrivalDate", format: '%d/%m/%Y' } } }, count: { $sum: 1 } } }
  ]).catch(() => 'Date format error in group by year'); // Might need adjustment if dates aren't properly formatted string DD/MM/YYYY

  console.log('E. Count by year:', byYear);

  const earliestDoc = await MarketPrice.findOne({ arrivalDate: { $exists: true, $ne: '' } }).sort({ arrivalDate: 1 }).lean();
  const latestDoc = await MarketPrice.findOne({ arrivalDate: { $exists: true, $ne: '' } }).sort({ arrivalDate: -1 }).lean();

  console.log('G. Earliest date:', earliestDoc ? earliestDoc.arrivalDate : null);
  console.log('H. Latest date:', latestDoc ? latestDoc.arrivalDate : null);

  const uniqCrops = await MarketPrice.distinct('cropName');
  const uniqStates = await MarketPrice.distinct('state');
  const uniqDistricts = await MarketPrice.distinct('district');
  const uniqMarkets = await MarketPrice.distinct('market');

  console.log('I. Unique counts:');
  console.log('- crops: ', uniqCrops.length);
  console.log('- states: ', uniqStates.length);
  console.log('- districts: ', uniqDistricts.length);
  console.log('- markets: ', uniqMarkets.length);

  await mongoose.disconnect();
}

main().catch(console.error);