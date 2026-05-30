import os
from google.adk.models.lite_llm import LiteLlm

_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()

# Model used by all ADK agents.
# LiteLlm wraps LiteLLM so ADK can call non-Gemini backends.
# Use gpt-4o-mini: the discovery agent accumulates many web_search results in one
# conversation, and this account's gpt-4o tokens-per-minute limit (30k) is too low to
# process them in a single request. gpt-4o-mini has much higher TPM, is far cheaper, and
# is well-suited to these structured tool-calling / extraction tasks.
if _PROVIDER == "openai":
    AGENT_MODEL = LiteLlm(model="openai/gpt-4o-mini")
else:
    AGENT_MODEL = "gemini-2.0-flash"
