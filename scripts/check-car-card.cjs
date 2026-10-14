const assert = require('assert/strict'), fs = require('fs'), Module = require('module'), ts = require('typescript');
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
require.extensions['.css'] = () => {};
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText, filename);
const load = Module._load;
Module._load = function(name, ...args) {
 if (name === 'next-i18next') return { useTranslation: () => ({ t: key => key }) };
 if (name === '@apollo/client') return { ...load.call(this, name, ...args), useReactiveVar: () => ({ _id: 'buyer' }) };
 return load.call(this, name, ...args);
};
const CarCard = require('../libs/components/car/CarCard.tsx').default;
const Recent = require('../libs/components/homepage/RecentlyAddedCarCard.tsx').default;
const Trend = require('../libs/components/homepage/TrendCarCard.tsx').default;
const car = { _id: '0123456789abcdef01234567', carTitle: 'Original listing title', carModel: 'IONIQ 5 Long Range AWD Premium Edition', brandData: {brandName:'Hyundai'},
 carYear:2024, carPrice:26900000, carFuelType:'ELECTRIC', carTransmission:'AUTOMATIC', carMileage:0, carLocation:'DAEJEON',
 carStatus:'ACTIVE', carCondition:'NEW', carImages:['uploads/car/example.jpg'], carViews:12, carLikes:3, carRent:false, carBarter:false, meLiked:[{myFavorite:true}] };
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
for (const [Component, props] of [[CarCard,{car,browse:true,likeCarHandler:async()=>{}}],[Recent,{car}],[Trend,{car,likeCarHandler:async()=>{}}]]) {
 const html = render(Component, props);
 assert(html.includes('Hyundai IONIQ 5 Long Range AWD Premium Edition'));
 assert(html.includes('₩26,900,000')); assert(html.includes('0<!-- --> km') || html.includes('0 km'));
 assert(html.includes('/car/detail?id=0123456789abcdef01234567'));
 assert(html.includes('New')); assert(!html.includes('Certified') && !html.includes('TOP'));
 assert(html.includes('Electric') && html.includes('Automatic') && html.includes('Daejeon'));
 if (Component !== Recent) { assert(html.includes('aria-pressed="true"')); assert(html.includes('Remove favorite')); }
 else assert(!html.includes('aria-pressed'), 'Recent does not invent a wishlist control');
}
const missing = render(Recent,{car:{...car,carMileage:null,carImages:[],carLocation:undefined,carFuelType:undefined,carTransmission:undefined}});
assert(missing.includes('/img/car/placeholder.svg')); assert(!missing.includes(' km')); assert(!missing.includes('undefined'));
assert(!missing.includes('title="Fuel"') && !missing.includes('title="Transmission"'));
assert(render(Recent,{car:{...car,carStatus:'SOLD'}}).includes('Sold'));
assert(render(Recent,{car:{...car,carStatus:'DELETE'}}).includes('Deleted'));
const prefixed=render(Recent,{car:{...car,carModel:'Hyundai IONIQ 5'}});assert(!prefixed.includes('Hyundai Hyundai'));
console.log('Car card checks passed: shared variants, data, KRW, zero/unknown mileage, fallback, status, routing and wishlist presence.');
