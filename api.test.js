const test=require("node:test"),assert=require("node:assert/strict"),request=require("supertest");
const {createApp}=require("../server"),{createDatabase}=require("../src/database");
function setup(){const db=createDatabase();return {app:createApp({db}),db}}
test("health and security headers",async()=>{const {app,db}=setup();const r=await request(app).get("/api/health").expect(200);assert.equal(r.body.status,"ok");assert.ok(r.headers["x-content-type-options"]);db.close()});
test("lists seeded opportunities",async()=>{const {app,db}=setup();const r=await request(app).get("/api/opportunities").expect(200);assert.ok(r.body.data.length>0);db.close()});
test("searches opportunities safely",async()=>{const {app,db}=setup();const r=await request(app).get("/api/opportunities?q=Frontend").expect(200);assert.ok(r.body.data.some(x=>x.title.includes("Frontend")));db.close()});
test("accepts valid application",async()=>{const {app,db}=setup();const r=await request(app).post("/api/applications").send({opportunityId:1,fullName:"Asha Kumar",email:"asha@example.com"}).expect(201);assert.ok(r.body.applicationId);db.close()});
test("rejects invalid application",async()=>{const {app,db}=setup();const r=await request(app).post("/api/applications").send({opportunityId:1,fullName:"A",email:"bad"}).expect(400);assert.ok(r.body.fields.email);db.close()});
test("rejects unknown opportunity",async()=>{const {app,db}=setup();await request(app).post("/api/applications").send({opportunityId:9999,fullName:"Asha Kumar",email:"asha@example.com"}).expect(404);db.close()});
test("rejects invalid mode",async()=>{const {app,db}=setup();await request(app).get("/api/opportunities?mode=evil").expect(400);db.close()});
