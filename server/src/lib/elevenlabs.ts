import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Readable } from "stream";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
const TTS_TIMEOUT_MS = 15_000;

export async function textToSpeechStream(text: string): Promise<Readable> {
  const webStream = await elevenlabs.textToSpeech.stream(
    VOICE_ID,
    {
      text,
      modelId: "eleven_flash_v2_5",
      voiceSettings: {
        stability: 0.4,
        similarityBoost: 0.75,
        style: 0.3,
        useSpeakerBoost: true,
      },
      outputFormat: "mp3_44100_128",
    },
    { timeoutInSeconds: TTS_TIMEOUT_MS / 1000 }
  );

  return Readable.fromWeb(
    webStream as import("stream/web").ReadableStream<Uint8Array>
  );
}
