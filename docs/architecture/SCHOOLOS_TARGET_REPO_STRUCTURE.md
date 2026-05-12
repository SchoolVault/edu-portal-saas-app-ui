# SchoolOS Target Repository Structure

## 1) Monorepo Layout (Recommended)

```text
schoolos/
  ├─ backend/
  │  ├─ build-logic/
  │  ├─ platform-common/
  │  │  ├─ security-starter/
  │  │  ├─ tenancy-starter/
  │  │  ├─ observability-starter/
  │  │  ├─ outbox-starter/
  │  │  └─ api-error-starter/
  │  ├─ services/
  │  │  ├─ gateway-service/
  │  │  ├─ identity-service/
  │  │  ├─ tenant-service/
  │  │  ├─ config-service/
  │  │  ├─ academics-service/
  │  │  ├─ finance-service/
  │  │  ├─ hr-service/
  │  │  ├─ admissions-service/
  │  │  ├─ engagement-service/
  │  │  ├─ transport-service/
  │  │  ├─ library-service/
  │  │  ├─ hostel-service/
  │  │  ├─ analytics-service/
  │  │  ├─ notification-service/
  │  │  ├─ ai-orchestrator-service/
  │  │  └─ integration-hub-service/
  │  ├─ contracts/
  │  │  ├─ openapi/
  │  │  └─ events/
  │  └─ tools/
  │     ├─ migration-runner/
  │     └─ tenant-provisioner/
  ├─ frontend/
  │  ├─ web-admin/
  │  ├─ teacher-app/
  │  ├─ parent-app/
  │  └─ shared-ui-kit/
  ├─ infra/
  │  ├─ docker/
  │  ├─ k8s/
  │  │  ├─ base/
  │  │  ├─ overlays/dev/
  │  │  ├─ overlays/staging/
  │  │  └─ overlays/prod/
  │  ├─ helm/
  │  ├─ terraform/
  │  └─ nginx/
  ├─ observability/
  │  ├─ grafana-dashboards/
  │  ├─ prometheus-rules/
  │  └─ otel-collector/
  ├─ docs/
  │  ├─ architecture/
  │  ├─ runbooks/
  │  ├─ adr/
  │  └─ security/
  └─ .github/workflows/
```

## 2) Service Internal Structure (Template)

```text
services/finance-service/
  ├─ src/main/java/com/schoolos/finance
  │  ├─ bootstrap/
  │  ├─ domain/
  │  ├─ application/
  │  ├─ adapter/
  │  ├─ security/
  │  └─ observability/
  ├─ src/main/resources/
  │  ├─ application.yaml
  │  └─ db/migration/
  ├─ src/test/
  │  ├─ unit/
  │  ├─ integration/
  │  └─ contract/
  ├─ build.gradle.kts
  └─ Dockerfile
```

## 3) AI Orchestrator Module Tree

```text
services/ai-orchestrator-service/
  ├─ domain/
  │  ├─ model/                 # Conversation, memory, tool execution models
  │  ├─ policy/                # Safety and permission policies
  │  └─ event/
  ├─ application/
  │  ├─ port/in/
  │  │  ├─ AskAgentUseCase.java
  │  │  └─ StreamAgentUseCase.java
  │  ├─ port/out/
  │  │  ├─ LlmProviderPort.java
  │  │  ├─ ToolExecutionPort.java
  │  │  ├─ VectorRetrieverPort.java
  │  │  └─ MemoryPort.java
  │  ├─ service/
  │  │  ├─ AgentRouterService.java
  │  │  ├─ ContextBuilderService.java
  │  │  ├─ PromptOrchestratorService.java
  │  │  ├─ ToolPlanningService.java
  │  │  └─ ResponseComposerService.java
  │  └─ dto/
  ├─ adapter/in/web/
  │  ├─ AiChatController.java
  │  └─ AiStreamController.java
  ├─ adapter/out/
  │  ├─ llm/openai/
  │  ├─ tools/http/
  │  ├─ vector/pgvector/
  │  ├─ memory/postgres/
  │  └─ messaging/kafka/
  ├─ security/
  │  ├─ AiToolAuthorizationGuard.java
  │  └─ PromptInjectionFilter.java
  └─ resources/db/migration/
```

## 4) Contracts and Versioning

OpenAPI:
- Every service publishes `contracts/openapi/<service>-v1.yaml`.
- Breaking changes require new major path or versioned endpoint group.

Events:
- Event schema files at `contracts/events/<domain>/<event>.v1.avsc`.
- Producer/consumer compatibility tested in CI.

AI tools:
- Tool schemas at `contracts/ai-tools/<tool-name>.v1.json`.
- Backward-compatible schema evolution only.

## 5) Kubernetes Manifest Layout

```text
infra/k8s/base/
  ├─ namespace.yaml
  ├─ configmaps/
  ├─ secrets-external/
  ├─ gateway/
  ├─ services/
  │  ├─ identity/
  │  ├─ academics/
  │  ├─ finance/
  │  └─ ai-orchestrator/
  ├─ stateful/
  │  ├─ postgres/
  │  ├─ redis/
  │  ├─ kafka/
  │  └─ elasticsearch/
  ├─ observability/
  └─ network-policies/
```

Standard manifest set per service:
- `deployment.yaml`
- `service.yaml`
- `hpa.yaml`
- `pdb.yaml`
- `servicemonitor.yaml`
- `networkpolicy.yaml`

## 6) CI/CD Workflow Files

Required workflows:
- `backend-ci.yml`: build, test, contract test, security scan.
- `frontend-ci.yml`: lint, unit test, bundle size budget.
- `docker-publish.yml`: image build and signing.
- `deploy-staging.yml`: staged deployment + smoke tests.
- `deploy-prod.yml`: canary rollout + automated rollback checks.

## 7) Coding Checklist for New Module

- Define aggregate roots and invariants first.
- Design command/query contracts.
- Add OpenAPI contract and events.
- Add Flyway migrations and indexes.
- Implement ports/adapters and security policies.
- Add unit + integration + contract tests.
- Add metrics/tracing/log fields.
- Add runbook entry and dashboard panels.

## 8) Extension Points

- Add new ERP module by adding service under `backend/services`.
- Add new AI agent profile by registering prompt + policy + tool group.
- Add channel provider by implementing `NotificationProviderPort`.
- Add third-party integration through `integration-hub-service` connector interface.
