import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { vapiWebhook } from "./vapi";

const http = httpRouter();

auth.addHttpRoutes(http);

// Add VAPI webhook endpoint
http.route({ 
  path: "/vapi", 
  method: "POST", 
  handler: vapiWebhook 
});

export default http;
