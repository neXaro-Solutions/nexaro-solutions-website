import assert from "node:assert/strict";
import {deriveIntelligenceStage} from "../intelligence-flow.mjs";
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
