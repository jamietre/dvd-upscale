
#FFmpegSource2(infile, atrack=-1)
#FFmpegSource2(infile, atrack=-1, fpsnum=30000, fpsden=1001)
#DirectShowSource(infile, fps=23.976, convertfps=true)

video=LWLibavVideoSource(infile)
audio=LWLibavAudioSource(infile)
AudioDub(video, audio)

# Revision JT.A19
TFM()
TDecimate()
spline36resize(width,height*3/2).daa().spline36resize(width,height)

# Some random things that might be useful one day
#YARK(thr=10, rad=2, str=25, scd=2, show=false)
#spline36resize(width,height*3/2).daa().spline36resize(width,height)
#santiag(strv=0, nns=4, nsize=5)

# Revision JT.A18 -- TERRIBLE
#qtgmc(Preset="Very Slow", InputType=1, SourceMatch=3)
#Srestore(23.976)

# Revision JT.A17
#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
#A2=Repair(QTGMC2, QTGMC3, 9)
#TFM(mChroma=true,clip2 = A2)
#TDecimate(cycleR=1,cycle=5)
#nnedi3(nsize=2, nns=4, qual=2)
#TFM()
#TDecimate()

# Revision JT.A16
#AssumeTFF()
#deinterlaced = nnedi3(nsize=2, nns=4, qual=2)
#TFM() 
#TDecimate()


# Revision JT.A15
#d = QTGMC(Preset="Slower",FPSDivisor=2)
#TFM(clip2=d) 
#TDecimate()

# Revision JT.A14
#deinterlaced = nnedi3()
#TFM(clip2=deinterlaced) 
#TDecimate()


# Revision JT.A13 - looks pretty awesome? - but jerky
#QTGMC(Preset="medium")
#SRestore(frate=23.976)


# Revision JT.A12 -  just eedi -- best so far??
# Generally very good, but occasional deinterlacing errors
#deinterlaced = nnedi3(field=-1, dh=false, Y=true, U=true, V=true, nsize=6, nns=1, qual=2, etype=0, pscrn=2, threads=0, opt=0, fapprox=15)
#TFM(clip2=deinterlaced, mode=5, PP=4, ubsco=False, mmsco=False, MI=150) 
#TDecimate(mode=1)

# Revision JT.A11 - basically looks the same as 10
# deinterlaced = nnedi3(field=-1, dh=false, Y=true, U=true, V=true, nsize=6, nns=1, qual=2, etype=0, pscrn=2, threads=0, opt=0, fapprox=15)
# TFM(clip2=deinterlaced, mode=5, PP=4, ubsco=False, mmsco=False, MI=150) 
# TDecimate(mode=1)
# QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
# QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
# Repair(QTGMC2, QTGMC3, 9)


# Revision JT.A10
# TFM()
# TDecimate()
# QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
# QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
# Repair(QTGMC2, QTGMC3, 9)


# Revision JT.A9 - rio grande v2 - shows some artifacting aroudn 1:50 that the other version does not
# TFM(order=1)
# TDecimate()
# QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
# QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
# Repair(QTGMC2, QTGMC3, 9)


# Revision JT.A8 - rio grande v2 - shows some artifacting aroudn 1:50 that the other version does not
# TFM()
# TDecimate(hybrid=1)
# QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
# QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
# Repair(QTGMC2, QTGMC3, 9)

# Revision JT.A7 - rio grande v2 - shows some artifacting aroudn 1:50 that the other version does not
# TFM(order=1)
# TDecimate(hybrid=1)
# QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
# QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
# Repair(QTGMC2, QTGMC3, 9)


# Revision JT.A6 - rio grande v2 - using LWLibavVideoSource
# TFM()
# TDecimate()
# QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
# QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
# Repair(QTGMC2, QTGMC3, 9)

# Revision JT.A1 - based on rio grande v1 - has audio sync issue
#TFM(order=1)
#TDecimate(hybrid=1)
#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, InputType=2, Lossless=2, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", inputType=3, prevGlobals="Reuse")
#Repair(QTGMC2, QTGMC3, 9)

# Revision JT.A2 - removed hybrid=1 from TFM - jerky
#TFM(order=1)
#TDecimate()
#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, InputType=2, Lossless=2, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", inputType=3, prevGlobals="Reuse")
#Repair(QTGMC2, QTGMC3, 9)

#Revision JT.A3 - no order=1; rio grande v2
#TFM()
#TDecimate(hybrid=1)
#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
#Repair(QTGMC2, QTGMC3, 9)

# Revision JT.A4 - rio grande v2
#TFM()
#TDecimate()
#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)
#Repair(QTGMC2, QTGMC3, 9)

# Revision JT.A5 - rio grande v1
#TFM()
#TDecimate()
#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, InputType=2, Lossless=2, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", inputType=3, prevGlobals="Reuse")
#Repair(QTGMC2, QTGMC3, 9)


# this is an alternative to the deint script below
#nnedi3(field=-1, dh=false, Y=true, U=true, V=true, nsize=6, nns=1, qual=2, etype=0, pscrn=2, threads=0, opt=0, fapprox=15)
