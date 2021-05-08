# IVTC3 - straight inverse telecine with spline36 resize to remove artifacts
# Trying for Stargate VOBs

D2VSource(infile_d2v)
SetFilterMTMode("DEFAULT_MT_MODE", 2)
TFM()
TDecimate(hybrid=1)
spline36resize(width,height*3/2).daa().spline36resize(width,height)
Prefetch(8)
