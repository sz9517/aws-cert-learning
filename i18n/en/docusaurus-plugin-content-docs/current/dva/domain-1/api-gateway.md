---
sidebar_position: 2
title: API Gateway (Build APIs)
---

# Amazon API Gateway: Turning Your Backend into a Managed API Front Door

> As a developer, you have written your Lambda function and prepared your backend logic, but the real challenge is "how does the outside world safely call it?" Who is allowed to call it? What happens when traffic spikes? Do you need to verify identity? <Term en="Amazon API Gateway" desc="A managed API entry point that receives HTTP requests, handles authorization, throttling, routing to backends (Lambda, HTTP services, etc.), caching, CORS, and version stages.">API Gateway</Term> is that "front door": requests hit it first, and it verifies identity, throttles, routes to the backend, then wraps the result and returns it to the caller. The DVA exam tests this service in a very "developer" way: integration formats, authorizers, stage variables, CORS, and error codes are all implementation details.

<Vocab title="📌 Terms to know first">

- **API (Application Programming Interface)**: the interface that lets programs call each other; here it means the HTTP endpoints you expose publicly.
- **Integration**: the configuration for "who to route to and how" once API Gateway receives a request; most commonly it routes to Lambda.
- **Stage**: one deployed version and runtime environment of the same API, such as `dev` or `prod`, each with its own URL.
- **Authorizer**: the mechanism that decides "does this request have permission to come in?", using IAM, Cognito, or a custom Lambda.
- **VTL (Velocity Template Language)**: the template language API Gateway uses for request/response mapping transforms.

</Vocab>

## Choosing Among the Three API Types: REST, HTTP, WebSocket

API Gateway offers more than one type of API. The DVA loves asking "which one fits this scenario", so lock in the differences first.

| Type | Best for | Key traits |
| --- | --- | --- |
| **REST API** | Full feature set: usage plans, API keys, request validation, VTL mapping, WAF, private endpoints, caching | Most complete feature set, but **pricier with slightly higher latency** |
| **HTTP API** | Simply routing requests to Lambda or HTTP backends, wanting **cheaper and faster**, built-in JWT/OIDC authorization | Roughly one-third the cost of REST API, lower latency; **does not support** API-key usage plans, VTL, or caching |
| **WebSocket API** | **Bidirectional real-time** communication: chat, live dashboards, multiplayer collaboration, push | Persistent connections, handling messages via `$connect`/`$disconnect`/custom routes |

:::tip[💡 How to choose on the exam]
See "lowest cost, lowest latency, just proxying to Lambda" -> choose **HTTP API**. See "needs API keys, usage plans, request/response transforms, caching, or WAF" -> choose **REST API**. See "real-time bidirectional, the server must actively push to the frontend" -> choose **WebSocket API**.
:::

### Why Default to HTTP API Rather Than the Most-Featured REST API?

Intuitively "more features means stronger", but the default answer in practice and on the exam is often **HTTP API**. The reason is plain: **most backends are just "one HTTP request routed to one Lambda"** and never touch VTL, caching, or usage plans. If you do not use them, there is no reason to pay three times as much and eat a bit more latency for them. **Assume HTTP API is enough first, and upgrade only when you clearly need a REST-only feature** - this "start simple, add complexity only when needed" mindset is itself a test point.

| Dimension | HTTP API | REST API |
| --- | --- | --- |
| Cost | Cheap (about 1/3 of REST) | Expensive |
| Latency | Lower | Slightly higher |
| Setup complexity | Simple, built-in CORS/JWT | Many, feature-heavy options |
| API keys / usage plans | Not supported | Supported |
| VTL mapping templates | Not supported | Supported |
| Response caching | Not supported | Supported |
| Private endpoints, WAF, request validation | Mostly unsupported | Supported |

:::info[🔑 When to NOT use HTTP API]
If you need to **meter and sell an API externally (API keys + usage plans)**, do **request/response transforms (VTL)** at the gateway layer, use **caching** to relieve the backend, or attach **WAF** or a **private endpoint** - HTTP API cannot do any of these, so switch to **REST API**. Conversely, if you are just proxying Lambda for an internal service, using REST API is overkill and wastes money.
:::

### Do You Even Need API Gateway? Or Just ALB or a Lambda Function URL?

API Gateway is not the only thing that can route traffic to a backend. The DVA tests whether a given scenario is worth putting a gateway in front at all. Here is the plain-language division of labor among three options:

| Option | When to choose it | Strengths | Shortcomings |
| --- | --- | --- | --- |
| **API Gateway** | You need **real API management**: authorizers, throttling, usage plans, keys, caching, request validation, multiple stages | One stop handles auth/throttle/transform/monitoring, so you do not write it yourself | One more service, extra cost and latency |
| **Application Load Balancer (ALB)** | The backend is **long-running containers/EC2** needing L7 routing, with high and simple request volume | **Low per-request cost** at high concurrency, supports long connections, fits microservice clusters | No API keys, usage plans, or native JWT authorization |
| **Lambda Function URL** | You just need a **plain HTTPS endpoint** for a Lambda, internal use or receiving webhooks | Zero extra service, free, minimal setup | No authorizers (only IAM or NONE), no throttling, no custom domain management, no usage plans |

:::tip[💡 How to quickly decide whether to put API Gateway in front]
One mnemonic: **"Do you need to MANAGE this API?"** Need authorizers/keys/throttling/caching/multiple stages -> use **API Gateway**; just need a URL for a Lambda for your own use or to receive a webhook -> a **Function URL** is enough; backend is a heavy container cluster needing L7 load balancing -> **ALB**. Do not force API Gateway onto a tiny internal endpoint, and do not expect ALB to add something like API keys that it inherently lacks.
:::

## Integrating with Lambda: Proxy Integration Is the Hot Topic

There are two ways to connect API Gateway to Lambda, and the DVA revolves almost entirely around **Lambda proxy integration**.

<Analogy title="🏢 Analogy: a full agent vs filling in a fixed form">

**Proxy integration** is like hiring a full agent: API Gateway packages the entire request (path, query string, headers, body) untouched into one `event` and hands it to Lambda, letting your code parse it and decide how to respond. Maximum flexibility, minimal configuration.

**Non-proxy integration** is like demanding the other party "fill in my fixed form": you use a VTL mapping template to map request fields one by one into the backend, then map the response back out. More tedious to set up but gives the finest control. Both development practice and the exam default to **proxy integration**.

</Analogy>

Under proxy integration, the `event` Lambda receives looks roughly like this (REST API version):

```json
{
  "resource": "/items/{id}",
  "path": "/items/42",
  "httpMethod": "GET",
  "headers": { "Authorization": "Bearer ..." },
  "queryStringParameters": { "verbose": "true" },
  "pathParameters": { "id": "42" },
  "body": null,
  "isBase64Encoded": false
}
```

And Lambda **must return a fixed format**, otherwise API Gateway responds with `502 Bad Gateway`:

```json
{
  "statusCode": 200,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"id\":42,\"name\":\"keyboard\"}",
  "isBase64Encoded": false
}
```

:::warning[🚑 Common mistake: body must be a string]
The `body` returned by proxy integration **must be a string** (wrapped with `JSON.stringify`); you cannot return an object directly. Returning an object directly, or omitting `statusCode`, makes the caller receive a `502`. This is a trap the DVA loves to bury.
:::

## Stages and Deployment: Changes Take Effect Only After You "Deploy"

This is the concept beginners get stuck on most: changing a setting in API Gateway **does not go live automatically**. You must create a **Deployment** and point it at a **Stage**.

<div className="flow"><div className="flow-node">Change settings</div><div className="flow-arrow">→</div><div className="flow-node">Create a<br/>Deployment</div><div className="flow-arrow">→</div><div className="flow-node">Point at a stage<br/>dev / prod</div><div className="flow-arrow">→</div><div className="flow-node">Invokable URL produced</div></div>

- Each stage has its own **invoke URL**, for example `.../prod` and `.../dev`.
- **Stage variables** are key-value pairs bound to a stage, used like environment variables. The most common use is letting the same API's `dev` stage call `myFunc:dev` and the `prod` stage call `myFunc:prod` (paired with Lambda aliases), so one API serves multiple environments.

:::info[🔑 An easily confused distinction]
A **deployment** is the action of "publishing a snapshot of the current settings"; a **stage** is "which environment that snapshot runs in and what URL it uses". Forgetting to redeploy after changing settings is the number-one cause of "I clearly changed it, why is nothing happening?"
:::

## Throttling and Usage Plans: Protect the Backend, Control Consumption

API Gateway can shield the backend from traffic spikes and allocate quotas to different callers.

- **Throttling**: limits traffic with two parameters, **rate (requests per second)** and **burst (the request bucket that can accumulate instantly)**, configurable at the account, stage, method, or usage-plan level. Exceeding it returns **`429 Too Many Requests`**.
- **Usage Plans + API Keys**: first hand the caller an **API key**, then attach the key to a **usage plan** whose quota and throttle settings define "how many calls per day, how many per second". Commonly used to sell an API to different customer tiers (free vs paid).

:::warning[🚑 Common mistake: API keys are not for authentication]
API keys are used only to **identify callers so a usage plan and metering can be applied**; they are **not an authentication mechanism**. To verify "who you are and whether you have permission", use the authorizers below. Also, **usage plans and API keys are supported only by REST API**, not HTTP API.
:::

## Authorization: Three Ways to Gate Access

"Who is allowed to call this API" is a high-frequency topic at the boundary of DVA Domain 2 (security) and Domain 1. The three authorization methods each suit different scenarios.

| Authorization method | How it works | When to use |
| --- | --- | --- |
| **IAM authorization** | The caller signs the request with <Term en="Signature Version 4" desc="The AWS standard for signing a request with IAM credentials, proving the request comes from an IAM identity and has not been tampered with.">SigV4</Term>, and API Gateway checks the IAM policy | The caller is **another AWS service, an internal system, or an application that has an IAM identity** |
| **Cognito authorizer** | The caller first logs in to a <Term en="Amazon Cognito" desc="A managed user sign-up/sign-in and identity service that issues JWT tokens after login.">Cognito</Term> user pool, gets a JWT token, and API Gateway verifies the token automatically | **End-user-facing** apps (web/mobile) that need login authentication |
| **Lambda authorizer (custom authorization)** | You write a Lambda that inspects the token or request and returns an IAM policy deciding allow or deny | You need **third-party or in-house authentication logic** (such as a custom JWT, OAuth, or partner tokens) |

<Scenario title="Real scenario: a mobile app calls the API after login">

Your to-do app lets users sign up and log in with email. The approach: after the user logs in to a **Cognito user pool** and receives a JWT, the app puts the JWT in the `Authorization` header on every API call. Once a **Cognito authorizer** is attached, API Gateway automatically verifies the token signature and expiry, and only lets verified requests through to Lambda, so you never write any token-verification code yourself.

If the verification logic is your company's own (for example a custom token shared with a partner), switch to a **Lambda authorizer**: your Lambda parses the token and returns an allow-or-deny IAM policy. The Lambda authorizer result can also be **cached** (with a TTL) to avoid re-running verification on every request.

</Scenario>

#### Pros and Cons of the Three Authorizers

Picking an authorizer is not about "which is strongest" but about "**who your caller is and who owns the verification logic**". Each has a cost:

- **IAM authorization**
  - Pros: you write no verification code; natural fit with the AWS permission model, great for service-to-service.
  - Cons: the caller **must have AWS credentials and sign with SigV4**, which ordinary end users (browser/mobile) cannot do, so it is **not suitable for consumer-facing login**.
- **Cognito authorizer**
  - Pros: user sign-up/sign-in/JWT verification is fully managed, the gateway verifies tokens automatically, and the developer writes **zero verification code**.
  - Cons: the identity source is tied to Cognito; if the company already has its own IdP or a custom token format, it may not fit.
- **Lambda authorizer**
  - Pros: **most flexible**; any custom logic (in-house JWT, OAuth, partner tokens, database lookups) can be written, and results can be cached to cut overhead.
  - Cons: you **write it, maintain it, and own its cold starts and errors**; a wrong policy format can let the whole API through or block it entirely. If Cognito or IAM works, do not force a Lambda authorizer.

## CORS: The Pitfall Developers Hit Most

<Term en="Cross-Origin Resource Sharing" desc="A browser security mechanism: when page JavaScript calls an API at a different origin (domain/port/protocol), the API must return allow headers, or the browser blocks the response.">CORS</Term> (Cross-Origin Resource Sharing) is a pit almost every frontend developer falls into. When your web page (for example `https://app.example.com`) uses JavaScript to call an API on a different domain, the **browser** first sends an `OPTIONS` **preflight request**, and the API must return the correct CORS headers before the browser allows the real request.

- Key headers to return: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`.
- **REST API**: to enable CORS for a resource, it creates an `OPTIONS` method that answers the preflight; but with **proxy integration**, the response headers on the actual request **must be added by your Lambda itself**.
- **HTTP API**: just declare the CORS configuration in the API settings, which is simpler.

:::warning[🚑 Common mistake: CORS is a browser-side matter]
Testing with Postman or `curl` works fine, but it "gets blocked by CORS" once on a web page, because **only browsers enforce CORS**. When you see a CORS error in the browser console, check first: (1) is the `OPTIONS` preflight handled, and (2) does the proxy-integration Lambda response **actually include** the `Access-Control-Allow-Origin` header.
:::

### Mapping Requests/Responses and VTL (Mapping Templates)

With **non-proxy integration**, API Gateway uses a **VTL mapping template** to rewrite "the incoming request" into the format the backend expects, then rewrite "the backend response" into what should go back to the caller, for example moving query-string values into the JSON body, or returning only a few selected fields of the backend response. Proxy integration usually does not need this (it forwards untouched), but the exam asks "what do you use to transform requests/responses at the API Gateway layer?" -> answer **VTL mapping templates**.

## API Caching and Common Error Codes

- **Caching (REST API only)**: once caching is enabled at the stage level, identical requests return the cached result directly, **reducing backend load and lowering latency**; you can set a TTL and cache keys, and callers can use the `Cache-Control` header to request a cache bypass.
- Quick reference for common error codes:

| Error code | Meaning | Common cause |
| --- | --- | --- |
| **429** | Too Many Requests | Throttling triggered or usage-plan quota exhausted |
| **502** | Bad Gateway | The proxy-integration Lambda **returns a malformed format** (body not a string, missing statusCode) |
| **503** | Service Unavailable | The backend is unreachable or temporarily unavailable |
| **504** | Integration Timeout | The backend took longer than the API Gateway integration timeout (REST API default limit is 29 seconds) |

:::info[🔑 Distinguishing 4xx from 5xx]
**4xx is the caller's problem** (bad request, no permission, over quota); **5xx is a backend or integration problem** (Lambda returned a bad format, timed out, or the service is down). When debugging, first check whether it starts with 4 or 5, and you know whether to investigate the request side or the backend.
:::

## Hands-on: Create and Deploy an HTTP API with the CLI

The following uses the AWS CLI to build a minimal HTTP API that proxies to an existing Lambda, then deploys to the default stage:

```bash
# 1. Create an HTTP API, directly specifying the Lambda to proxy (auto-creates integration and default route)
aws apigatewayv2 create-api \
  --name todo-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:ap-northeast-1:123456789012:function:todoHandler

# 2. Allow API Gateway to invoke this Lambda (add a resource policy)
aws lambda add-permission \
  --function-name todoHandler \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com

# 3. Look up the invoke URL (ApiEndpoint), then test it directly
curl https://<api-id>.execute-api.ap-northeast-1.amazonaws.com/
```

:::info[🔑 What you should expect to see]
- After step 1 succeeds, `create-api` returns a block of JSON whose **`ApiEndpoint`** is your invokable URL (shaped like `https://abcd1234.execute-api.ap-northeast-1.amazonaws.com`).
- **If you skip step 2 (no add-permission)**, step 3 `curl` returns **`{"message":"Internal Server Error"}`** with status 500, because API Gateway has no permission to invoke your Lambda. This is exactly where beginners get stuck; add `add-permission` and try again and it goes through.
- Once permissions are correct, `curl` returns **the content of the `body` in your Lambda response** (remember the proxy-integration `body` must be a string).
:::

A REST API needs one extra step, "create a deployment and point it at a stage", before it takes effect:

```bash
aws apigateway create-deployment \
  --rest-api-id abc123 \
  --stage-name prod
```

:::warning[🚑 Common pitfall: forgetting to redeploy means your change did nothing]
For a REST API, **any change to a method, integration, authorizer, or CORS requires running `create-deployment` again**, or the live stage keeps the old settings. The symptom is "I clearly saved it in the console, but the call did not change." Also, the three favorite proxy-integration traps: **(1) forgetting `JSON.stringify` on `body` causes 502; (2) not returning `Access-Control-Allow-Origin` yourself gets the browser to block it with CORS; (3) assuming adding an API key means identity was verified (it only meters, it is not authentication).** These three are almost guaranteed to be buried in the DVA.
:::

<Cost>

- **REST API** is billed per million requests and costs roughly three times more than HTTP API; enabling **caching** adds a charge based on cache capacity (GB/hour).
- **HTTP API** is much cheaper per million requests; prefer it to save cost for scenarios that simply proxy to Lambda.
- **Throttling and usage plans** are not about saving your own money, but about **protecting the backend** (for example avoiding Lambda concurrency blowups or DynamoDB being hammered) and metering customers.

</Cost>

:::tip[💡 DVA key takeaways]
- Proxy-integration Lambda has a **fixed return format** (`statusCode` + string `body`); a wrong return -> `502`.
- After changing settings you must **create a deployment pointing at a stage** for it to take effect; **stage variables** paired with Lambda aliases give you multiple environments.
- **API key is not authentication**, only usage-plan metering; verify identity with IAM, Cognito, or a Lambda authorizer.
- **Only browsers enforce CORS**; with proxy integration you must add the CORS headers in the Lambda response yourself.
- For cheap and low latency choose **HTTP API**; for keys/usage plans/caching/VTL choose **REST API**.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [Set up Lambda proxy integrations (REST API)](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
- [Usage plans with API keys](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)
- [Enable CORS for a REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

</Refs>

👉 Next: [DynamoDB for Developers](./dynamodb.md)
