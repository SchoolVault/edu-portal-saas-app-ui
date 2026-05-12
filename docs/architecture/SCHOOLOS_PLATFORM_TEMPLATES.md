# SchoolOS Platform Templates (Production Starter)

## 1) Spring Boot Service Dockerfile Template

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S schoolos && adduser -S schoolos -G schoolos
COPY build/libs/*.jar app.jar
USER schoolos
EXPOSE 8080
ENTRYPOINT ["java","-XX:+UseContainerSupport","-XX:MaxRAMPercentage=75.0","-jar","/app/app.jar"]
```

## 2) AI Orchestrator Kubernetes Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-orchestrator
  labels:
    app: ai-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-orchestrator
  template:
    metadata:
      labels:
        app: ai-orchestrator
    spec:
      containers:
        - name: ai-orchestrator
          image: ghcr.io/schoolos/ai-orchestrator:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ai-secrets
                  key: openai-api-key
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-orchestrator-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-orchestrator
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## 3) API Gateway Policy Baseline

- JWT verification and tenant claim validation (`tid` mandatory).
- Per-tenant rate limits: read, write, AI-stream buckets.
- Request/response size guards.
- CORS allow-list by tenant admin domain.
- mTLS for internal service-to-service routes (if applicable).

## 4) GitHub Actions CI Template

```yaml
name: backend-ci
on:
  pull_request:
    paths:
      - "backend-spring/**"
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
      - name: Build and test
        working-directory: backend-spring
        run: ./gradlew clean test bootJar
      - name: Dependency scan
        run: echo "Run SCA scanner here"
      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: backend-spring/build/reports/tests
```

## 5) OpenAPI Endpoint Shape (AI Streaming)

```yaml
openapi: 3.0.3
info:
  title: SchoolOS AI API
  version: 1.0.0
paths:
  /api/v1/ai/chat/stream:
    post:
      summary: Stream AI response with tool events
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [conversationId, message]
              properties:
                conversationId:
                  type: string
                message:
                  type: string
                agentType:
                  type: string
                  enum: [PRINCIPAL, TEACHER, PARENT, FINANCE, ADMISSION, ANALYTICS]
      responses:
        "200":
          description: text/event-stream response
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## 6) Event Contract Example (Tool Invocation)

```json
{
  "eventId": "uuid",
  "eventType": "schoolos.ai.tool_invoked.v1",
  "occurredAt": "2026-05-10T12:00:00Z",
  "tenantId": "tenant_123",
  "actorUserId": "user_887",
  "correlationId": "corr_9921",
  "payload": {
    "toolName": "getFeeDefaulters",
    "latencyMs": 142,
    "status": "SUCCESS",
    "riskLevel": "READ"
  }
}
```

## 7) Flyway Migration Naming Convention

- `V001__platform_baseline.sql`
- `V046__ai_agent_foundation.sql`
- `V101__pgvector_documents.sql`
- `V120__tenant_billing_and_plans.sql`

Rule:
- Backward-compatible DB changes preferred.
- Destructive changes only via controlled expand/contract migrations.

## 8) Prompt and Tool Governance

Prompt repository fields:
- `template_id`, `agent_type`, `version`, `locale`, `safety_policy_ref`, `max_tokens`.

Tool governance workflow:
1. Define JSON schema.
2. Security review and permission map.
3. Shadow-mode execution in staging.
4. Contract tests + load tests.
5. Feature-flagged rollout by tenant tier.
