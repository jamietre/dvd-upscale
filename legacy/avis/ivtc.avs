video=LWLibavVideoSource(infile)
audio=LWLibavAudioSource(infile)
AudioDub(video, audio)

# Works well for Stargate SG1 DVD
TFM()
TDecimate()
# removes residual deinterlacing artifacts
spline36resize(width,height*3/2).daa().spline36resize(width,height)
