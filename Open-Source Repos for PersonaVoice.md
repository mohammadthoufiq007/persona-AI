# Open-Source Repos for PersonaVoice

Oct 26, 2026 · @Thoufiq

## Recommendation

Borrow a few small pieces and keep the Next.js-on-Vercel plan; a full voice framework would add a separate Python server and force a rewrite of the secure plan.

- **Use directly:** the VAD library, a few UI components, and a text splitter.
- **Read for reference:** Gnani's own Pipecat, LiveKit and Python SDK code, to confirm protocol details.
- **Fallback only:** Pipecat with its React Voice UI Kit, if the hand-built audio pipeline stalls.

Check each repo's license before copying code from it.

## Use directly

Three libraries are worth installing; two need a caveat.

| Repo / package | What it gives you | Caveat |
| --- | --- | --- |
| [@ricky0123/vad-web](https://docs.vad.ricky0123.com/user-guide/browser) | In-browser voice activity detection; returns 16 kHz audio per utterance | You must serve its worklet file, the ONNX model, and the onnxruntime-web `.wasm` and `.mjs` files yourself, and set `baseAssetPath` and `onnxWASMBasePath`. The plan's asset-copy script should copy all of them. |
| [ElevenLabs UI](https://github.com/elevenlabs/ui) | shadcn-based components: orb, waveforms, bar visualizer, voice button | The Orb is MIT-licensed but uses Three.js (adds three, react-three-fiber, drei), so the bundle grows. Use only presentational parts; the conversation components are built for ElevenLabs agents. Remove ElevenLabs names from your UI. Or keep the Framer Motion orb. |
| @langchain/textsplitters | Ready-made chunker for the KB ingest script | Optional; take only this package, not all of LangChain. |

## Read for reference only

These are Python and won't run inside your Next.js app, but their source shows exactly how Gnani expects its APIs to be called.

| Repo / package | Why read it | What to check |
| --- | --- | --- |
| [pipecat-gnani](https://github.com/Gnani-AI-Mintlify/pipecat-gnani) | Gnani-maintained adapter that wraps Prisma and Timbre as Pipecat services, with interruption support | `examples/foundational/agent.py`; how realtime STT frames are paced; how TTS streams are parsed; how interruptions stop synthesis |
| [gnani-vachana](https://pypi.org/project/gnani-vachana/) | Official core SDK with REST, WebSocket and SSE clients | Audio formats and defaults; optionally use it in a one-off script to generate the static greeting audio |
| [livekit-plugins-gnani](https://pypi.org/project/livekit-plugins-gnani/) | Gnani's LiveKit plugin | A second reference for the same protocol details |

## Fallback: Pipecat

Switch to Pipecat only if the hand-built audio pipeline is still not working by the end of 27 Oct.

[Pipecat](https://docs.pipecat.ai/overview/clients) is an open-source Python framework with Gnani services available. Its [Voice UI Kit](https://docs.pipecat.ai/client/voice-ui-kit) provides React components and hooks, and connects to a Pipecat server over WebRTC.

- **Gain:** voice detection, streaming and barge-in with much less custom audio code.
- **Cost:** a separate always-on Python server (not Vercel), a different security model, and a rewrite of the current plan.
- **Rule:** keep the current plan unless the Day-1 vertical slice shows the audio code is eating the schedule.

## Sources

- [pipecat-gnani (Pipecat docs)](https://docs.pipecat.ai/api-reference/server/services/tts/gnani)
- [Gnani Pipecat plugin docs](https://docs.gnani.ai/pipecat/introduction)
- [vad-web browser guide](https://docs.vad.ricky0123.com/user-guide/browser)
- [ElevenLabs UI](https://github.com/elevenlabs/ui)
- [Pipecat Voice UI Kit](https://docs.pipecat.ai/client/voice-ui-kit)
