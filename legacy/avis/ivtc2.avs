# Similar to Joel Hruska's Rio Grande
# Source: https://www.spot.im/s/1pq8G3f56IpRGQ8CmfelUwzpH1c

# Good for Star Trek Voyager
# Improves on Rio Grande with performance; TDecimate hybrid mode; and adding grain
# ivtc results in jaggies and other deinterlacing artifacts with ST Voyager

D2VSource(infile_d2v)

SetFilterMTMode("DEFAULT_MT_MODE", 2)
TFM()
TDecimate(hybrid=1)
QTGMC2 = QTGMC(Preset="Very Slow", TR2=4, SourceMatch=3, Lossless=2, InputType=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.1, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
QTGMC3 = QTGMC(preset="Very Slow", TR2=4, SourceMatch=3, Lossless=2, InputType=3)
Repair(QTGMC2, QTGMC3, 9)
AddGrain(var=1.0)
Prefetch(8)


#grainresrtore=0.3 -- possible caused flashing rainbow frame?
#Other change was TR2=4

#QTGMC2 = QTGMC(Preset="Very Slow", SourceMatch=3, TR2=5, InputType=2, Lossless=2, noiserestore=0.1, NoiseDeint="Generate", grainrestore=0.3, MatchEnhance=0.75, Sharpness=0.5, MatchPreset="Very Slow", MatchPreset2="Very Slow")
#QTGMC3 = QTGMC(preset="Very Slow", SourceMatch=3, Lossless=2, InputType=3, TR2=5)

