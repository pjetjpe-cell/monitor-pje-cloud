# Vídeos renderizados a partir do Estúdio de Vídeo

O Estúdio (`ferramentas/artefato/estudio-video.html`) desenha cada cena em canvas.
Estes scripts usam o mesmo desenho para produzir um MP4 final com narração e trilha,
quadro a quadro, sem depender do navegador do usuário.

## Pipeline (exemplo: `porto2life/`)

```bash
pip install piper-tts faster-whisper numpy
# vozes pt-BR do Piper (≈60 MB cada)
for v in cadu faber; do for e in onnx onnx.json; do
  curl -sSLO "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pt/pt_BR/$v/medium/pt_BR-$v-medium.$e"; done; done

cd porto2life
python3 gerar.py ../pt_BR-cadu-medium.onnx   # narração por cena → voz/*.wav + projeto.json (durações e tempo da fala)
python3 ../transcrever.py voz/*.wav           # confere a pronúncia transcrevendo de volta
python3 mix.py                                # trilha sintetizada + efeitos + ducking → audio.wav (−14 LUFS)
node render.mjs ../../artefato/estudio-video.html projeto.json video-mudo.mp4
ffmpeg -i video-mudo.mp4 -i audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart final.mp4
```

`cenas.py` tem dois textos por cena: `fala` (legenda) e `locucao` (o que a voz lê,
com números por extenso). Palavras que o Piper pronuncia mal ficam só na tela:
"GAV" virou "a empresa" e "Habite-se" virou "conclusão da obra" na narração.

Edge-TTS não funciona no ambiente de nuvem (usa WebSocket); no PC funciona e soa melhor.
