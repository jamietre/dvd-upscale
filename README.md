# dvd-upscale

Tooling to automate workflows for processing video. The core of this is TypeScript command line utilities & API for automating:

- DVDDecrypter
- DgIndex
- AviSynth+
- Topaz Video Enhance AI (VEAI)
- FFMpeg
- MkvMerge

## Project Goals

- The ability to take in input VOB file and completely process it through a variety of user-configured steps without any user intervention.
- Maintain a consistent pattern for organizing work files
- Allow management of profiles for each project
- Ability to optimize computing resources, e.g. run tasks in parallel that do not share the same resources. For example, VEAI uses GPU only, whereas ffmpeg encoding (probably) uses CPU. We should be able to queue up tasks and have successive tasks run in sequence whenever a resource is available.

## Status

#### Done

- All CLI tools have working implementations for the options I've used in my own processes
- Most CLI tools support far more options than I've exposed, but will add them as needed
- FFMPeg has a very complex API. There are other existing attempts to make a more consumer-friendly fluent API in JavaScript, but I didn't find them any easier to use, so I wrote my own. This might not have the correct mental model for some advanced FFMpeg usages but it makes sense to me so far.

#### To Do

- Automate batch processing
- Automatically detect if a step has already been completed (look for output file); add universal option to always overwrite
- Add some better exception handling; e.g. if any image file is missing from the images output, we should restart VEAI and re-do only the missing images
- Email notification of status/errors
- Migrate handling of subtitles from ffmpeg to mkvmerge. (It makes more sense to keep the FFMpeg part of this as simple as possible since it's a far more complex tool; do anything we can do with mkvemerge there)
- Make configuration better
- Add documention (automation?) for installing all the avisynth dependencies
- don't hardcode types for the avisynth scripts, these should be runtime configurable

### Prerequisites

You need to have all the tools above installed.
You need a lot of avisynth plugins (todo: document this)

### Configuration

Right now config is just hardcoded under the `/config` directory. You need to do the following:

- set up paths to the tools on your PC in config.json
- update (or add) a profile (like "voyager.json") for your project

### Usage

There's no complilation for this project right now. Instead just run everything using `ts-node`.

```
> yarn add -g ts-node
> git clone https://github.com/jamietre/dvd-upscale.git
> cd dvd-upscale
> ts-node ./src/decrypt-cli -p voyager -drive i

```

## Contents

`src/` - source files; all main commands are named `something-cli` and will provide help if you just run them without options
`config/` - configuration files
`doc/` - detailed documentation (todo)
`legacy/` - A bunch of bash scripts hacked together that was the original incarnation of this project; not maintained

## Discussion

The hard part of doing this involves

- good inverse telecine and deinterlacing of bad sources
- dealing with variable frame rate sources
- automating a lot of really old, janky tools

One workflow here uses dgindex to extract timecodes from the VOB files, and then they get merged back in with mkvmerge at the end, allowing us to retain the VFR format for ugly sources like Star Trek Voyager & DS9.
