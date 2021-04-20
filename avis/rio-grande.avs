video=LWLibavVideoSource(infile)
audio=LWLibavAudioSource(infile)
AudioDub(video, audio)

TFM()
TDecimate()
QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
Repair(QTGMC2, QTGMC3, 9)
