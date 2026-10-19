import assert from "node:assert/strict";
import {deriveIntelligenceStage,createIntelligenceFlow} from "../intelligence-flow.mjs";
const base = {goalId:"g1"};
assert.equal(deriveIntelligenceStage(base),null,"No work: no fake progress");
assert.deepEqual(deriveIntelligenceStage({...base,job:{goal_id:"g1",status:"running",stage:"verifying"}}),
  {phase:"verify",label:"Pilot prüft die Ergebnisqualität"});
assert.equal(deriveIntelligenceStage({...base,job:{goal_id:"another",status:"running",stage:"drafting"}}),null,
  "Do not display another user's or another goal's work");
assert.equal(deriveIntelligenceStage({...base,job:{goal_id:"g1",status:"completed",stage:"drafting"}}),null);
assert.equal(deriveIntelligenceStage({...base,shoppingStage:"working"}).phase,"research");
assert.equal(deriveIntelligenceStage({...base,autoSession:{active:true,label:"Schritt 2 wird geprüft"}}).label,
  "Schritt 2 wird geprüft");
assert.equal(deriveIntelligenceStage({...base,executionActive:true}).phase,"work");
console.log("Intelligence Flow state contract passed");

// Lifecycle stays stable across app rerenders and real server-stage updates.
const label={textContent:""},particles={innerHTML:""};
const root={
  dataset:{},attributes:{},innerHTML:"",
  setAttribute(name,value){this.attributes[name]=value},
  querySelector(selector){return selector===".pif-message"?label:selector===".pif-particles"?particles:null}
};
const flow=createIntelligenceFlow(root);
assert.equal(root.dataset.open,"false");
flow.start("understand","Pilot ordnet deine Anfrage ein");
assert.equal(root.dataset.open,"true");
assert.equal(label.textContent,"Pilot ordnet deine Anfrage ein");
flow.start("verify","Pilot prüft die Ergebnisqualität");
assert.equal(root.dataset.phase,"verify");
assert.equal(root.dataset.open,"true","Stage changes never remount the animation");
flow.finish("Pilot wartet auf deine Antwort","waiting");
assert.equal(root.dataset.phase,"waiting");
flow.start("create","Pilot übernimmt die Antwort");
assert.equal(root.dataset.open,"true","New work cancels pending concealment");
flow.reset();
assert.equal(root.dataset.open,"false");
assert.equal(root.attributes["aria-hidden"],"true");
assert.match(particles.innerHTML,/pif-particle/);
console.log("Intelligence Flow animation lifecycle passed");
