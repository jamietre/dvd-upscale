# IVTC6 - straight inverse telecine with square pixel resize - one pass (CFR)
# Designed for Man from UNCLE

# API
# "inputFile": "Name of input D2V file"

D2VSource(inputFile)

# Uncomment to test
#trim(0,4800)
SetFilterMTMode("DEFAULT_MT_MODE", MT_MULTI_INSTANCE)

ConvertToYV16()
fft3dfilter(sigma=3,sigma2=3,sigma3=12,sigma4=3,bt=3,plane=2)
chroma = checkmate(thr=12,max=25,tthr2=25)
luma   = checkmate(thr=12,max=25,tthr2=0)
fixed  = luma.MergeChroma(chroma)

tfm()
tdecimate()
#  spline64resize(width,height*3/2).daa().spline64resize(width,height)
Crop(8, 0, 704, 480)
Spline64Resize(720, 540)

Prefetch(4)


