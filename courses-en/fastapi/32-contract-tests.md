# 32. Contract tests: OpenAPI and Schemathesis

## Intro: "a client broke — we changed a field"

The mobile app expects `user_id: int`; after a refactor the backend returns `userId: string` — OpenAPI updated, but the **consumers** found out in prod. Contract testing locks in the **agreement** between the API and its clients before deploy.

## What you'll learn

- OpenAPI as the **source of truth** in FastAPI.
- Validating responses against the schema.
- **Schemathesis** — property-based tests from the spec.
- Breaking vs non-breaking changes.
- A CI gate on the contract ([gitlab-basic](../gitlab-basic/README.md)).

---

## OpenAPI in FastAPI

FastAPI generates the schema automatically:

| URL | Format |
|-----|--------|
| `/openapi.json` | JSON Schema |
| `/docs` | Swagger UI |
| `/redoc` | ReDoc |

```python
app = FastAPI(
    title="Task API",
    version="1.2.0",
    openapi_tags=[{"name": "items", "description": "CRUD items"}],
)
```

**Rule:** response_model and status_code in the decorator aren't "documentation" — they're the **contract**.

```python
@router.get("/{id}", response_model=ItemOut, responses={404: {"model": ErrorOut}})
async def get_item(id: int) -> ItemOut:
    ...
```

---

## Exporting and diffing the schema

```bash
curl -s http://localhost:8090/openapi.json | jq . > openapi-baseline.json
# after changes
diff openapi-baseline.json openapi-new.json
```

In CI, keep a **committed** `openapi.json` or generate it in a job and compare — a breaking change = a failed pipeline.

Relation to versioning: [39-versioning-idempotency](39-versioning-idempotency.md).

---

## Validating responses in pytest

The `openapi-spec-validator` library or a manual check via `jsonschema`:

```python
import json
import jsonschema
import pytest

@pytest.fixture(scope="session")
def openapi_schema():
    with open("openapi.json") as f:
        return json.load(f)

def test_list_items_matches_schema(client, openapi_schema):
    r = client.get("/api/v1/items")
    assert r.status_code == 200
    # resolve $ref for operationId list_items...
    jsonschema.validate(r.json(), resolved_response_schema)
```

It's simpler to leave this to Schemathesis.

---

## Schemathesis overview

[Schemathesis](https://schemathesis.readthedocs.io/) reads OpenAPI and **generates** requests, looking for 5xx and schema mismatches.

```bash
pip install schemathesis
st run http://localhost:8090/openapi.json --checks all
```

| Check | What it catches |
|-------|-----------|
| not_a_server_error | 5xx |
| status_code_conformance | a code not in the spec |
| content_type_conformance | wrong Content-Type |
| response_schema_conformance | JSON not matching the schema |

**Hypothesis** under the hood — boundary values, empty strings, huge ints.

```bash
# GET only, base-url for a reverse proxy
st run openapi.json --base-url=http://localhost:8090 \
  --hypothesis-max-examples=50 \
  --endpoint="/api/v1/items"
```

On the [`deploy/fastapi`](../../deploy/fastapi/README.md) stand: bring up compose, run `st run` against `/openapi.json`.

---

## Auth in contract tests

```bash
st run openapi.json \
  --header "Authorization: Bearer ${TEST_TOKEN}" \
  --auth-type=bearer
```

Or a `--hooks` Python file: log in before protected endpoints.

---

## Stateful testing (preview)

Schemathesis 3.x supports a **state machine** from OpenAPI links — chains of "create → get → delete". Useful for CRUD; setup is trickier than a stateless run.

---

## Breaking vs non-breaking

| Change | Type |
|--------|-----|
| Add an optional field to a response | non-breaking |
| Remove a field | **breaking** |
| Change the `id` type int → string | **breaking** |
| A new required query param | **breaking** |
| A new endpoint | non-breaking |
| Deprecate a header | non-breaking with a sunset |

Policy: **semver API** + a changelog; mobile clients lag by 2 versions.

---

## CI pipeline

```yaml
contract-test:
  script:
    - docker compose up -d api
    - pip install schemathesis
    - st run http://api:8000/openapi.json --base-url=http://api:8000 \
        --checks all --hypothesis-max-examples=100
  allow_failure: false
```

In parallel: `openapi-diff` between `main` and the MR branch.

See [gitlab-basic/04-lab-first-pipeline](../gitlab-basic/04-lab-first-pipeline.md).

---

## Limitations

| Limitation | Workaround |
|-------------|-------|
| Doesn't know business invariants | extra pytest cases |
| Can DDoS the test DB | `--workers=1`, a test DB, rate limit off |
| WebSocket isn't in OAS 3.0 paths | separate tests |
| 401 across the whole API | hooks / a test token |

---

## Summary

**OpenAPI** in FastAPI is a living contract. **Schemathesis** automates finding 5xx and schema drift. In CI: `st run` + a schema diff on the MR. This complements, not replaces, [31-lab-testing](31-lab-testing.md).

## Checklist

- Where do you get the OpenAPI spec from FastAPI?
- What does `response_schema_conformance` check?
- An example of a breaking change?
- Why a committed `openapi.json`?

Next lesson: [33-docker-production](33-docker-production.md).
