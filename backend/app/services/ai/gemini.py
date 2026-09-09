"""Thin wrapper over the Gemini Interactions API.

See GEMINI_API_NOTES.md in this directory for the verified request/response
shapes — this SDK's surface is `client.interactions.create(...)`, not the older
`models.generate_content(...)` that most examples still show.

Two design points:

* Everything goes through `client.aio`, the SDK's native async surface, so a
  model call never blocks the event loop the way a threadpool bridge around the
  sync client would.
* When no API key is configured the module reports `is_live = False` and callers
  fall back to `app.services.ai.demo`. The AI tab is then still fully usable —
  it just says so — rather than erroring or silently pretending.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger("nkp.ai")


class GeminiError(RuntimeError):
    """Raised when the model call fails in a way the caller should surface."""


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any]
    call_id: str | None = None


@dataclass
class ModelResult:
    text: str = ""
    data: dict | None = None
    tool_calls: list[ToolCall] = field(default_factory=list)
    interaction_id: str | None = None
    model: str = ""
    tools_used: list[str] = field(default_factory=list)


def _tool_declaration(name: str, description: str, parameters: dict) -> dict:
    """Build a function tool in the shape the Interactions API expects."""
    return {"type": "function", "name": name, "description": description, "parameters": parameters}


class GeminiClient:
    def __init__(self, api_key: str, model: str, fast_model: str) -> None:
        self._api_key = api_key
        self.model = model
        self.fast_model = fast_model
        self._client = None

    @property
    def is_live(self) -> bool:
        return bool(self._api_key)

    def _sdk(self):
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=self._api_key)
        return self._client

    @staticmethod
    def _extract_tool_calls(interaction: Any) -> list[ToolCall]:
        """Pull function calls out of an interaction's steps.

        Written defensively with getattr throughout: the SDK preserves variants
        it does not recognise rather than raising, so a step may not carry the
        attributes a strict reading of the docs implies.
        """
        calls: list[ToolCall] = []
        for step in getattr(interaction, "steps", None) or []:
            if getattr(step, "type", None) != "function_call":
                continue
            arguments = getattr(step, "arguments", None) or {}
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except json.JSONDecodeError:
                    arguments = {}
            calls.append(
                ToolCall(
                    name=getattr(step, "name", "") or "",
                    arguments=arguments,
                    call_id=getattr(step, "id", None),
                )
            )
        return calls

    async def generate(
        self,
        *,
        instruction: str,
        prompt: str | list,
        schema: type[BaseModel] | None = None,
        tools: list[dict] | None = None,
        model: str | None = None,
        temperature: float | None = None,
        previous_interaction_id: str | None = None,
    ) -> ModelResult:
        """One non-streaming turn. With `schema`, returns parsed JSON in `data`."""
        if not self.is_live:
            raise GeminiError("Gemini is not configured")

        chosen = model or self.model
        request: dict[str, Any] = {
            "model": chosen,
            "input": prompt,
            "system_instruction": instruction,
        }
        if schema is not None:
            request["response_format"] = {
                "type": "text",
                "mime_type": "application/json",
                "schema": schema.model_json_schema(),
            }
        if tools:
            request["tools"] = tools
        if temperature is not None:
            request["generation_config"] = {"temperature": temperature}
        if previous_interaction_id:
            request["previous_interaction_id"] = previous_interaction_id

        try:
            interaction = await self._sdk().aio.interactions.create(**request)
        except Exception as exc:  # noqa: BLE001 - provider errors are opaque
            logger.exception("Gemini call failed")
            raise GeminiError(str(exc)) from exc

        text = getattr(interaction, "output_text", "") or ""
        data = None
        if schema is not None and text:
            try:
                data = json.loads(text)
            except json.JSONDecodeError as exc:
                # A structured call that comes back unparseable is a failure the
                # caller must see — silently returning prose would let malformed
                # output reach the UI as if it were valid.
                raise GeminiError(f"Model returned unparseable JSON: {text[:200]}") from exc

        return ModelResult(
            text=text,
            data=data,
            tool_calls=self._extract_tool_calls(interaction),
            interaction_id=getattr(interaction, "id", None),
            model=chosen,
        )

    async def stream_text(
        self,
        *,
        instruction: str,
        prompt: str | list,
        tools: list[dict] | None = None,
        model: str | None = None,
        previous_interaction_id: str | None = None,
    ) -> AsyncIterator[tuple[str, Any]]:
        """Yield ``(kind, payload)`` events: ``("text", str)`` then ``("done", ModelResult)``."""
        if not self.is_live:
            raise GeminiError("Gemini is not configured")

        chosen = model or self.model
        request: dict[str, Any] = {
            "model": chosen,
            "input": prompt,
            "system_instruction": instruction,
            "stream": True,
        }
        if tools:
            request["tools"] = tools
        if previous_interaction_id:
            request["previous_interaction_id"] = previous_interaction_id

        collected: list[str] = []
        final: Any = None
        try:
            stream = await self._sdk().aio.interactions.create(**request)
            async for event in stream:
                kind = getattr(event, "event_type", None)
                if kind == "step.delta":
                    delta = getattr(event, "delta", None)
                    if delta is not None and getattr(delta, "type", None) == "text":
                        chunk = getattr(delta, "text", "") or ""
                        if chunk:
                            collected.append(chunk)
                            yield "text", chunk
                elif kind in {"interaction.completed", "interaction.created"}:
                    final = getattr(event, "interaction", None) or final
        except Exception as exc:  # noqa: BLE001
            logger.exception("Gemini stream failed")
            raise GeminiError(str(exc)) from exc

        yield (
            "done",
            ModelResult(
                text="".join(collected),
                tool_calls=self._extract_tool_calls(final) if final is not None else [],
                interaction_id=getattr(final, "id", None) if final is not None else None,
                model=chosen,
            ),
        )

    async def run_with_tools(
        self,
        *,
        instruction: str,
        prompt: str,
        tools: list[dict],
        executor: Callable[[str, dict], Any],
        max_rounds: int = 4,
    ) -> ModelResult:
        """Drive the manual tool loop.

        The Interactions API has no automatic function calling — the model asks
        for a call, we execute it and hand the result back on the next turn. The
        round cap stops a model that keeps re-requesting the same tool from
        looping indefinitely.
        """
        used: list[str] = []
        result = await self.generate(instruction=instruction, prompt=prompt, tools=tools)

        for _ in range(max_rounds):
            if not result.tool_calls:
                break

            results_input: list[dict] = []
            for call in result.tool_calls:
                used.append(call.name)
                try:
                    output = await _maybe_await(executor(call.name, call.arguments))
                except Exception as exc:  # noqa: BLE001 - surface to the model, not the user
                    logger.warning("Tool %s failed: %s", call.name, exc)
                    output = {"error": str(exc)}
                results_input.append(
                    {
                        "type": "function_result",
                        "name": call.name,
                        "call_id": call.call_id,
                        "result": [{"type": "text", "text": json.dumps(output, default=str)}],
                    }
                )

            result = await self.generate(
                instruction=instruction,
                prompt=results_input,
                tools=tools,
                previous_interaction_id=result.interaction_id,
            )

        result.tools_used = used
        return result


async def _maybe_await(value):
    if hasattr(value, "__await__"):
        return await value
    return value


@lru_cache
def get_gemini() -> GeminiClient:
    settings = get_settings()
    return GeminiClient(
        api_key=settings.gemini_api_key,
        model=settings.gemini_model,
        fast_model=settings.gemini_fast_model,
    )


__all__ = ["GeminiClient", "GeminiError", "ModelResult", "ToolCall", "get_gemini", "_tool_declaration"]
