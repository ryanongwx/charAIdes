import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Readable } from "stream";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Rachel voice — warm, expressive, natural
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function textToSpeechStream(text: string): Promise<Readable> {
  // stream() returns HttpResponsePromise<ReadableStream<Uint8Array>>
  // Awaiting it gives us the ReadableStream (Web Streams API)
  const webStream = await elevenlabs.textToSpeech.stream(VOICE_ID, {
    text,
    modelId: "eleven_flash_v2_5",
    voiceSettings: {
      stability: 0.4,
      similarityBoost: 0.75,
      style: 0.3,
      useSpeakerBoost: true,
    },
    outputFormat: "mp3_44100_128",
  });

  // Convert Web ReadableStream to Node.js Readable for Express piping
  // Node 18+ supports Readable.fromWeb()
  const nodeReadable = Readable.fromWeb(
    webStream as import("stream/web").ReadableStream<Uint8Array>
  );
  return nodeReadable;
}
