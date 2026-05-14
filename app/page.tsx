"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { Check, Clipboard, FileAudio, Loader2, Upload, X } from "lucide-react";

type UploadState = "idle" | "ready" | "uploading" | "done" | "error";

const accept = [
  ".aac",
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".oga",
  ".ogg",
  ".wav",
  ".webm",
  "audio/*",
  "video/mp4",
].join(",");

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<UploadState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState("it");
  const [copied, setCopied] = useState(false);

  const canTranscribe = useMemo(() => Boolean(file) && state !== "uploading", [file, state]);

  function pickFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setText("");
    setError("");
    setCopied(false);
    setState("ready");
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    pickFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  async function transcribe() {
    if (!file) return;

    setState("uploading");
    setError("");
    setCopied(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { text?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Trascrizione non riuscita.");
      }

      setText(payload.text ?? "");
      setState("done");
    } catch (transcriptionError) {
      setError(transcriptionError instanceof Error ? transcriptionError.message : "Trascrizione non riuscita.");
      setState("error");
    }
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function clearFile() {
    setFile(null);
    setText("");
    setError("");
    setCopied(false);
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="shell">
      <section className="workspace" aria-label="Trascrizione audio">
        <div className="header">
          <div>
            <p className="eyebrow">Speech to text</p>
            <h1>Trascrivi audio WhatsApp in testo</h1>
          </div>
          <div className="language">
            <label htmlFor="language">Lingua</label>
            <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="it">Italiano</option>
              <option value="en">Inglese</option>
              <option value="es">Spagnolo</option>
              <option value="fr">Francese</option>
              <option value="de">Tedesco</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>

        <label
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" accept={accept} onChange={onInputChange} />
          <span className="uploadIcon" aria-hidden="true">
            <Upload size={30} />
          </span>
          <span className="dropTitle">Trascina qui il file audio</span>
          <span className="dropText">Oppure tocca per scegliere un file da PC o telefono.</span>
          <span className="formats">m4a, mp3, ogg, opus/webm, wav, mp4, flac fino a 25 MB</span>
        </label>

        {file ? (
          <div className="fileRow">
            <div className="fileMeta">
              <FileAudio size={22} />
              <div>
                <strong>{file.name}</strong>
                <span>{formatBytes(file.size)}</span>
              </div>
            </div>
            <button className="iconButton" type="button" onClick={clearFile} aria-label="Rimuovi file">
              <X size={18} />
            </button>
          </div>
        ) : null}

        <div className="actions">
          <button className="primary" type="button" disabled={!canTranscribe} onClick={transcribe}>
            {state === "uploading" ? <Loader2 className="spin" size={20} /> : <FileAudio size={20} />}
            {state === "uploading" ? "Trascrivo..." : "Trascrivi"}
          </button>
          <button className="secondary" type="button" disabled={!text} onClick={copyText}>
            {copied ? <Check size={19} /> : <Clipboard size={19} />}
            {copied ? "Copiato" : "Copia testo"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <section className="result" aria-label="Testo trascritto">
          <div className="resultHeader">
            <h2>Trascrizione</h2>
            {state === "done" ? <span>Pronta</span> : null}
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Il testo apparira qui dopo la trascrizione."
            spellCheck
          />
        </section>
      </section>
    </main>
  );
}
