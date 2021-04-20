#https://community.topazlabs.com/t/upscaling-old-dvds-to-4k-scifi-star-trek/23122/7

## infile_d2v
## mode

D2VSource(infile_d2v)
ConvertToYV12(interlaced=true)

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
  fft3dfilter(sigma=3,sigma2=3,sigma3=12,sigma4=3,bt=3,plane=2)
  chroma = checkmate(thr=12,max=25,tthr2=25)
  luma   = checkmate(thr=12,max=25,tthr2=0)
  fixed  = luma.MergeChroma(chroma)

  tfm(Input,input=TfmFile)
  tdecimate(mode=5, hybrid=2, cycleR=1, vfrDec=0, input=Metrics, tfmIn=TfmFile, mkvOut=Timestamps)

  santiag()
  Deblock()
  pSharpen()

  QTGMC(inputtype = 1, EZDenoise = 1.00)
  Crop(8, 0, 704, 480)
  #BicubicResize(720, 540)
  Spline64Resize(720, 540)
}


