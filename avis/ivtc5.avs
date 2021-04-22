#https://community.topazlabs.com/t/upscaling-old-dvds-to-4k-scifi-star-trek/23122/7

## infile_d2v
## mode

D2VSource(infile_d2v)

# Uncomment to test
#trim(0,4800)
SetFilterMTMode("DEFAULT_MT_MODE", MT_MULTI_INSTANCE)

tfm_file = infile_root + ".temp_tfm.txt"
metrics_file = infile_root + ".temp_metrics.txt"
mode == 2 ? process(d2v=infile_d2v,TfmFile=tfm_file, Metrics=metrics_file, Timestamps=outfile_timecodes) : get_metrics(d2v=infile_d2v,TfmFile=tfm_file, Metrics=metrics_file) 
Prefetch(4)

#Pass 01
function get_metrics(clip Input, string "d2v", string "TfmFile", string "Metrics") {   
    tfm(Input,output=TfmFile)
    tdecimate(mode=4, output=Metrics)
}

#Pass 02
function process(clip Input, string "d2v", string "TfmFile", string "Metrics", string "Timestamps") {
  ConvertToYV12(Input)
  fft3dfilter(sigma=3,sigma2=3,sigma3=12,sigma4=3,bt=3,plane=2)
  chroma = checkmate(thr=12,max=25,tthr2=25)
  luma   = checkmate(thr=12,max=25,tthr2=0)
  fixed  = luma.MergeChroma(chroma)

  tfm(input=TfmFile)
  tdecimate(mode=5, hybrid=2, cycleR=1, vfrDec=0, input=Metrics, tfmIn=TfmFile, mkvOut=Timestamps)
  
  Deblock()
  
  QTGMC2 = QTGMC(Preset="Very Slow", TR2=4, SourceMatch=3, Lossless=2, InputType=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
  QTGMC3 = QTGMC(preset="Very Slow", TR2=4, SourceMatch=3, Lossless=2, InputType=3)
  Repair(QTGMC2, QTGMC3, 9)
  
  santiag()
  Crop(8, 0, 704, 480)
  Spline64Resize(720, 540)
}


