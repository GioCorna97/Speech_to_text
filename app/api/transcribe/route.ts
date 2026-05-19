import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const acceptedTypes = new Set([
  "audio/aac",
  "audio/flac",
  "audio/m4a",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
]);

const acceptedExtensions = /\.(aac|flac|m4a|mp3|mp4|mpeg|mpga|oga|ogg|wav|webm)$/i;
const maxFileSize = 25 * 1024 * 1024;
const defaultTranscriptionModel = "whisper-1";
const acceptedTranscriptionModels = new Set([
  "whisper-1",
]);

function getTranscriptionModel() {
  const configuredModel = process.env.OPENAI_TRANSCRIPTION_MODEL?.trim();

  if (!configuredModel) {
    return defaultTranscriptionModel;
  }

  if (!acceptedTranscriptionModels.has(configuredModel)) {
    console.warn(
      `Ignoring unsupported OPENAI_TRANSCRIPTION_MODEL "${configuredModel}". Falling back to ${defaultTranscriptionModel}.`,
    );
    return defaultTranscriptionModel;
  }

  return configuredModel;
}

export async function POST(request: Request) {
  console.log("OPENAI_API_KEY exists:", Boolean(process.env.OPENAI_API_KEY));
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Manca OPENAI_API_KEY nelle variabili ambiente." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const language = formData.get("language");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Carica un file audio valido." }, { status: 400 });
  }

  const fileTypeAllowed = file.type ? acceptedTypes.has(file.type) : false;
  const extensionAllowed = acceptedExtensions.test(file.name);

  if (!fileTypeAllowed && !extensionAllowed) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa audio WhatsApp o file mp3, m4a, wav, ogg, webm, mp4, flac." },
      { status: 400 },
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { error: "File troppo grande. Il limite configurato e 25 MB." },
      { status: 400 },
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = getTranscriptionModel();
  console.log("Transcription model:", model);

  try {
    const transcription = await client.audio.transcriptions.create({
      file,
      model,
      language: typeof language === "string" && language !== "auto" ? language : undefined,
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trascrizione non riuscita.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
