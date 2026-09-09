# Gemini Interactions API — verified contract

Verified against `google-genai==2.22.0` installed in `backend/.venv` (Sept 2026), by
introspecting `google.genai._gaos.types.interactions.*`. **Do not code from memory** —
the older `client.models.generate_content(...)` shape that most training data contains
is not what this SDK exposes. The current surface is `client.interactions.create(...)`.

## Client

```python
from google import genai
client = genai.Client(api_key=settings.gemini_api_key)   # or GEMINI_API_KEY env var
```

## `client.interactions.create(...)` accepted fields

Confirmed from `CreateModelInteractionParam.__annotations__`:

| field | required | notes |
|---|---|---|
| `model` | yes | e.g. `gemini-3.8-flash` |
| `input` | yes | str, or a list of typed input parts |
| `system_instruction` | no | plain `str` (not a Content object) |
| `tools` | no | `list[ToolParam]` — see below |
| `stream` | no | `bool` |
| `previous_interaction_id` | no | multi-turn without resending history |
| `generation_config` | no | `{"temperature": ..., ...}` |
| `response_format` | no | structured output — see below |
| `response_mime_type` | no | |
| `response_modalities` | no | |
| `safety_settings` | no | |
| `store`, `background`, `labels`, `service_tier`, `environment`, `webhook_config` | no | |

Note there is **no** `response_schema` / `config=types.GenerateContentConfig(...)` kwarg
on this method, and **no** `contents=`.

## Structured output

`response_format` is a tagged union; the text variant carries a JSON Schema under a field
aliased `schema` (python attribute `schema_`):

```python
response_format={
    "type": "text",
    "mime_type": "application/json",
    "schema": MyPydanticModel.model_json_schema(),
}
```

## Tool / function declarations

`ToolParam` is a union of CodeExecution / URLContext / GoogleSearch / FileSearch /
**Function** / GoogleMaps / ComputerUse / MCPServer / Retrieval. The function variant
(`google.genai._gaos.types.interactions.function.Function`) is:

```python
{
    "type": "function",              # literal discriminator
    "name": "lookup_shipment",
    "description": "...",
    "parameters": { ... JSON Schema ... },
}
```

## Reading results

- Non-streaming text: `interaction.output_text`
- Tool calls: entries in `interaction.steps` where `step.type == "function_call"`,
  carrying `.name`, `.arguments` (already-parsed dict), and `.id`
- Returning a tool result — send as the next `input`, with `previous_interaction_id`:

```python
input=[{
    "type": "function_result",
    "name": step.name,
    "call_id": step.id,
    "result": [{"type": "text", "text": json.dumps(result)}],
}]
```

**There is no automatic function calling** — the execute-and-return loop is manual.

## Streaming

```python
stream = client.interactions.create(model=..., input=..., stream=True)
for event in stream:
    if event.event_type == "step.delta" and event.delta.type == "text":
        yield event.delta.text
```

The SDK preserves unrecognised variants rather than raising (`UnknownTool`,
`UnknownInteractionSSEEvent` with `is_unknown=True`), so treat event handling
defensively and always guard with `getattr`.

## Current models (ai.google.dev/gemini-api/docs/models, Sept 2026)

- `gemini-3.8-flash` — flagship flash, agents/long-horizon work. **Default here.**
- `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` — cheap/fast
- `gemini-3.1-pro-preview` — deepest reasoning
- `gemini-3.1-flash-image` (Nano Banana 2) — image generation
- `gemini-2.5-*` — GA-stable only until 2026-10-16; do not build on these
- Gemini 2.0 Flash / Flash-Lite — **shut down** June 2026
