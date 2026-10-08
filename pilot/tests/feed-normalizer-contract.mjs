import assert from "node:assert/strict";
import {parseProductFeed,PILOT_FEED_SOURCES} from "../feed-normalizer.mjs";

const awin=[
  "aw_product_id;product_name;merchant_name;search_price;aw_deep_link;delivery_cost;currency",
  'a1;"Profi-Bürostuhl, ergonomisch";Händler Nord;"1.299,99 €";https://publisher.example-shop.de/click?affid=1;0;EUR',
  'a2;"Monitor, 27 Zoll";Technikshop;199,95;https://shop.de/monitor;5,90;EUR',
].join("\n");
const a=parseProductFeed(awin);
assert.deepEqual({read:a.stats.read,valid:a.stats.valid,skipped:a.stats.skipped},{read:2,valid:2,skipped:0});
assert.equal(a.offers[0].price_eur,1299.99);
assert.equal(a.offers[0].shipping_eur,0);
assert.equal(a.offers[0].affiliate,true);
assert.equal(a.offers[0].name,"Profi-Bürostuhl, ergonomisch");
assert.equal(a.offers[1].affiliate,true,"The Awin deep link is a supplied tracking field");

const tsv="product_id\tproduct_name\tmerchant_name\tprice\tproduct_url\n"+
 "s1\tLaptop Pro\tShop AG\t899,50\thttps://shop.de/pro";
const t=parseProductFeed(tsv);
assert.equal(t.offers[0].price_eur,899.5);
assert.equal(t.offers[0].shipping_eur,null,"Unknown shipping is never treated as zero");
assert.equal(t.offers[0].affiliate,false);

const json=JSON.stringify({products:[
 {sku:"sku1",name:"Kamera",advertiser_name:"Fotohaus",price:"199.95",currency:"EUR",product_url:"https://foto.de/kamera"},
 {sku:"sku2",name:"Kamera",advertiser_name:"Fotohaus",price:"199.95",currency:"USD",product_url:"https://foto.de/kamera"},
 {sku:"sku3",name:"Kamera",advertiser_name:"Fotohaus",price:"0",currency:"EUR",product_url:"https://foto.de/kamera"},
 {sku:"sku4",name:"Kamera",advertiser_name:"Fotohaus",price:"149",product_url:"http://foto.de/item"},
 {sku:"sku5",name:"Kamera",advertiser_name:"Fotohaus",price:"149",product_url:"https://localhost/item"},
 {sku:"sku6",name:"Kamera",price:"149",product_url:"https://foto.de/item"}
]});
const j=parseProductFeed(json);
assert.equal(j.stats.valid,1);
assert.equal(j.stats.skipped,5);
assert.equal(j.stats.reasons.currency,1);
assert.equal(j.stats.reasons.price,1);
assert.equal(j.stats.reasons.url,2);
assert.equal(j.stats.reasons.required,1);

const escaped=parseProductFeed('product_id,product_name,merchant_name,price,product_url\n'+
 '1,"Hallo, ""Welt""",Anbieter,29.99,https://anbieter.de/1');
assert.equal(escaped.offers[0].name,'Hallo, "Welt"');
assert.throws(()=>parseProductFeed("product_id;product_name\n1;a"),/Preisspalte/);
assert.throws(()=>parseProductFeed("[]"),/keine|Keine|Produktzeilen|Liste/i);
assert.equal(PILOT_FEED_SOURCES.length,12);
console.log("PASS Pilot Feed: 12 partner source formats, CSV/TSV/JSON, currency, URLs, unknown shipping, tracking, data quality");
