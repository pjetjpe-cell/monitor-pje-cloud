import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
for f in sys.argv[1:]:
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ar","16000","-ac","1","-f","f32le","-"],capture_output=True).stdout
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), language="pt", beam_size=5)
    print(f.split('/')[-1], '→', ''.join(s.text for s in segs).strip(), flush=True)
