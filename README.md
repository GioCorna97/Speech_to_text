# Trascrivi Audio

Web app Next.js per caricare file audio da PC o cellulare, anche audio scaricati da WhatsApp, e ottenere una trascrizione testuale.

## Avvio locale

1. Installa le dipendenze:

```bash
npm install
```

2. Crea `.env.local` partendo da `.env.example` e inserisci la chiave:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

3. Avvia:

```bash
npm run dev
```

Apri `http://localhost:3000`.

## Deploy su Vercel

1. Importa questa cartella/repository in Vercel.
2. In `Project Settings > Environment Variables`, aggiungi `OPENAI_API_KEY`.
3. Facoltativo: aggiungi `OPENAI_TRANSCRIPTION_MODEL` se vuoi cambiare modello.
4. Fai deploy.

## Formati supportati

La pagina accetta file audio comuni come `m4a`, `mp3`, `ogg`, `webm`, `wav`, `mp4`, `aac`, `flac`, `mpeg` e `mpga`, con limite applicativo di 25 MB per file.
