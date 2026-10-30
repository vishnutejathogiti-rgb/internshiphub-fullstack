const test=require("node:test"),assert=require("node:assert/strict");
const {validateApplication}=require("../src/validation");
test("accepts valid application",()=>{const r=validateApplication({opportunityId:1,fullName:"Asha Kumar",email:"asha@example.com"});assert.equal(r.valid,true)});
test("rejects invalid email",()=>{assert.ok(validateApplication({opportunityId:1,fullName:"Asha Kumar",email:"bad"}).errors.email)});
test("rejects invalid name and id",()=>{const r=validateApplication({opportunityId:-1,fullName:"A",email:"a@b.com"});assert.ok(r.errors.fullName);assert.ok(r.errors.opportunityId)});
test("rejects oversized cover letter",()=>{assert.ok(validateApplication({opportunityId:1,fullName:"Asha Kumar",email:"a@b.com",coverLetter:"x".repeat(2001)}).errors.coverLetter)});
