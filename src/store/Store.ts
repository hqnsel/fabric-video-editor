import { makeAutoObservable } from 'mobx';
import { fabric } from 'fabric';
import { getUid, isHtmlAudioElement, isHtmlImageElement, isHtmlVideoElement } from '@/utils';
import anime from 'animejs';
import { MenuOption, EditorElement, Animation, TimeFrame, VideoEditorElement, AudioEditorElement, Placement, ImageEditorElement, Effect, TextEditorElement, ShapeEditorElement } from '../types';
import { FabricUitls, getShapeAnimationProperties } from '@/utils/fabric-utils';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { ShapeAnimationType } from '../types';

export function isEditorImageElement(element: EditorElement): element is ImageEditorElement {
  return element.type === "image";
}

export function isEditorVideoElement(element: EditorElement): element is VideoEditorElement {
  return element.type === "video";
}

export class Store {
  canvas: fabric.Canvas | null

  backgroundColor: string;

  selectedMenuOption: MenuOption;
  audios: string[]
  videos: string[]
  images: string[]
  editorElements: EditorElement[]
  selectedElement: EditorElement | null;

  maxTime: number
  animations: Animation[]
  animationTimeLine: anime.AnimeTimelineInstance;
  playing: boolean;

  currentKeyFrame: number;
  fps: number;

  possibleVideoFormats: string[] = ['mp4', 'webm'];
  selectedVideoFormat: 'mp4' | 'webm';

  makeElementsEditable() {
    if (this.canvas) {
      this.canvas.forEachObject((obj) => {
        obj.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          editable: true
        });
        obj.setCoords();
      });
      this.canvas.renderAll();
    }
  }

  constructor() {
    this.canvas = null;
    this.videos = [];
    this.images = [];
    this.audios = [];
    this.editorElements = [];
    this.backgroundColor = '#111111';
    this.maxTime = 30 * 1000;
    this.playing = false;
    this.currentKeyFrame = 0;
    this.selectedElement = null;
    this.fps = 60;
    this.animations = [];
    this.animationTimeLine = anime.timeline();
    this.selectedMenuOption = 'Video';
    this.selectedVideoFormat = 'mp4';
    makeAutoObservable(this);
  }

  get currentTimeInMs() {
    return this.currentKeyFrame * 1000 / this.fps;
  }

  setCurrentTimeInMs(time: number) {
    this.currentKeyFrame = Math.floor(time / 1000 * this.fps);
    this.animationTimeLine.seek(time);
  }

  setSelectedMenuOption(selectedMenuOption: MenuOption) {
    this.selectedMenuOption = selectedMenuOption;
  }

  setCanvas(canvas: fabric.Canvas | null) {
    this.canvas = canvas;
    if (canvas) {
      canvas.backgroundColor = this.backgroundColor;
      canvas.selection = true; // Enable object selection
      canvas.hoverCursor = 'move';
      canvas.moveCursor = 'move';
      canvas.defaultCursor = 'default';
      canvas.rotationCursor = 'crosshair';
    }
  }

  setBackgroundColor(backgroundColor: string) {
    this.backgroundColor = backgroundColor;
    if (this.canvas) {
      this.canvas.backgroundColor = backgroundColor;
    }
  }

  updateEffect(id: string, effect: Effect) {
    const index = this.editorElements.findIndex((element) => element.id === id);
    const element = this.editorElements[index];
    if (isEditorVideoElement(element) || isEditorImageElement(element)) {
      element.properties.effect = effect;
    }
    this.refreshElements();
  }

  setVideos(videos: string[]) {
    this.videos = videos;
  }

  addShapeResource(shapeObject) {
    const id = getUid();
    const element: ShapeEditorElement = {
      id,
      name: `Shape ${this.editorElements.length + 1}`,
      type: 'shape',
      placement: shapeObject.placement,
      timeFrame: {
        start: 0,
        end: this.maxTime,
      },
      properties: shapeObject.properties,
    };
  
    let fabricObject = this.createShapeObject(element);
  
    if (fabricObject) {
      fabricObject.set({
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
      });
  
      element.fabricObject = fabricObject;
      if (this.canvas) {
        this.canvas.add(fabricObject);
        this.canvas.renderAll();
      }
      this.editorElements.push(element);
      this.setSelectedElement(element);
  
      if (element.properties.animation && element.properties.animation !== 'none') {
        const animation = {
          id: getUid(),
          type: 'shape',
          targetId: id,
          duration: element.properties.transitionDuration,
          properties: {
            animationType: element.properties.animation,
            startTime: 0,
            endTime: element.properties.transitionDuration,
          },
        };
        this.addAnimation(animation);
      }
  
      return element;
    }
  }

  addVideoResource(video: string) {
    this.videos = [...this.videos, video];
  }
  addAudioResource(audio: string) {
    this.audios = [...this.audios, audio];
  }
  addImageResource(image: string) {
    this.images = [...this.images, image];
  }

  addAnimation(animation: Animation) {
    console.log('Adding animation:', animation);
    if (animation.type === 'shape') {
      animation.properties.startTime = animation.properties.startTime || 0;
      animation.properties.endTime = animation.properties.endTime || this.maxTime;
    }
    this.animations.push(animation);
    console.log('Animations after adding:', this.animations);
    this.refreshAnimations();
  }

  updateAnimation(id: string, updatedProperties: Partial<Animation>) {
    const index = this.animations.findIndex(a => a.id === id);
    if (index !== -1) {
      this.animations[index] = { ...this.animations[index], ...updatedProperties };
      this.refreshAnimations();
    }
  }

  refreshAnimations() {
    this.animationTimeLine = anime.timeline({
      autoplay: false,
    });
  
    this.animations.forEach((animation) => {
      const element = this.editorElements.find((e) => e.id === animation.targetId);
      if (!element || !element.fabricObject) return;
  
      const fabricObject = element.fabricObject;
  
      switch (animation.type) {
        case "shape":
          const startTime = animation.properties.startTime;
          const endTime = animation.properties.endTime;
          const speed = animation.properties.speed || 1;
          const totalDuration = endTime - startTime;
          
          const animationProps = getShapeAnimationProperties(animation.properties.animationType);
          
          let animationConfig = {
            ...animationProps,
            duration: animation.properties.animationType === 'rotate' ? 1000 / speed : totalDuration,
            easing: 'linear',
            loop: true
          };
        
          if (animation.properties.animationType === 'rotate') {
            animationConfig.loopComplete = (anim: anime.AnimeInstance) => {
              if (this.currentTimeInMs >= endTime) {
                anim.pause();
              }
            };
          }
        
          this.animationTimeLine.add({
            targets: fabricObject,
            ...animationConfig,
            autoplay: false,
            update: () => {
              fabricObject.setCoords();
              this.canvas?.renderAll();
            }
          }, startTime);
          break;
        case "fadeIn": {
          this.animationTimeLine.add({
            opacity: [0, 1],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, element.timeFrame.start);
          break;
        }
        case "fadeOut": {
          this.animationTimeLine.add({
            opacity: [1, 0],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, element.timeFrame.end - animation.duration);
          break;
        }
        case "slideIn": {
          const direction = animation.properties.direction;
          const targetPosition = {
            left: element.placement.x,
            top: element.placement.y,
          }
          const startPosition = {
            left: (direction === "left" ? - element.placement.width : direction === "right" ? this.canvas?.width : element.placement.x),
            top: (direction === "top" ? - element.placement.height : direction === "bottom" ? this.canvas?.height : element.placement.y),
          }
          if (animation.properties.useClipPath) {
            const clipRectangle = FabricUitls.getClipMaskRect(element, 50);
            fabricObject.set('clipPath', clipRectangle)
          }
          if (element.type === "text" && animation.properties.textType === "character") {
            this.canvas?.remove(...element.properties.splittedTexts)
            // @ts-ignore
            element.properties.splittedTexts = getTextObjectsPartitionedByCharacters(element.fabricObject, element);
            element.properties.splittedTexts.forEach((textObject) => {
              this.canvas!.add(textObject);
            })
            const duration = animation.duration / 2;
            const delay = duration / element.properties.splittedTexts.length;
            for (let i = 0; i < element.properties.splittedTexts.length; i++) {
              const splittedText = element.properties.splittedTexts[i];
              const offset = {
                left: splittedText.left! - element.placement.x,
                top: splittedText.top! - element.placement.y
              }
              this.animationTimeLine.add({
                left: [startPosition.left! + offset.left, targetPosition.left + offset.left],
                top: [startPosition.top! + offset.top, targetPosition.top + offset.top],
                delay: i * delay,
                duration: duration,
                targets: splittedText,
              }, element.timeFrame.start);
            }
            this.animationTimeLine.add({
              opacity: [1, 0],
              duration: 1,
              targets: fabricObject,
              easing: 'linear',
            }, element.timeFrame.start);
            this.animationTimeLine.add({
              opacity: [0, 1],
              duration: 1,
              targets: fabricObject,
              easing: 'linear',
            }, element.timeFrame.start + animation.duration);
  
            this.animationTimeLine.add({
              opacity: [0, 1],
              duration: 1,
              targets: element.properties.splittedTexts,
              easing: 'linear',
            }, element.timeFrame.start);
            this.animationTimeLine.add({
              opacity: [1, 0],
              duration: 1,
              targets: element.properties.splittedTexts,
              easing: 'linear',
            }, element.timeFrame.start + animation.duration);
          }
          this.animationTimeLine.add({
            left: [startPosition.left, targetPosition.left],
            top: [startPosition.top, targetPosition.top],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, element.timeFrame.start);
          break;
        }
        case "slideOut": {
          const direction = animation.properties.direction;
          const startPosition = {
            left: element.placement.x,
            top: element.placement.y,
          }
          const targetPosition = {
            left: (direction === "left" ? - element.placement.width : direction === "right" ? this.canvas?.width : element.placement.x),
            top: (direction === "top" ? -100 - element.placement.height : direction === "bottom" ? this.canvas?.height : element.placement.y),
          }
          if (animation.properties.useClipPath) {
            const clipRectangle = FabricUitls.getClipMaskRect(element, 50);
            fabricObject.set('clipPath', clipRectangle)
          }
          this.animationTimeLine.add({
            left: [startPosition.left, targetPosition.left],
            top: [startPosition.top, targetPosition.top],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, element.timeFrame.end - animation.duration);
          break;
        }
        case "breathe": {
          const itsSlideInAnimation = this.animations.find((a) => a.targetId === animation.targetId && (a.type === "slideIn"));
          const itsSlideOutAnimation = this.animations.find((a) => a.targetId === animation.targetId && (a.type === "slideOut"));
          const timeEndOfSlideIn = itsSlideInAnimation ? element.timeFrame.start + itsSlideInAnimation.duration : element.timeFrame.start;
          const timeStartOfSlideOut = itsSlideOutAnimation ? element.timeFrame.end - itsSlideOutAnimation.duration : element.timeFrame.end;
          if (timeEndOfSlideIn <= timeStartOfSlideOut) {
            const duration = timeStartOfSlideOut - timeEndOfSlideIn;
            const easeFactor = 4;
            const suitableTimeForHeartbeat = 1000 * 60 / 72 * easeFactor
            const upScale = 1.05;
            const currentScaleX = fabricObject.scaleX ?? 1;
            const currentScaleY = fabricObject.scaleY ?? 1;
            const finalScaleX = currentScaleX * upScale;
            const finalScaleY = currentScaleY * upScale;
            const totalHeartbeats = Math.floor(duration / suitableTimeForHeartbeat);
            if (totalHeartbeats >= 1) {
              const keyframes = [];
              for (let i = 0; i < totalHeartbeats; i++) {
                keyframes.push({ scaleX: finalScaleX, scaleY: finalScaleY });
                keyframes.push({ scaleX: currentScaleX, scaleY: currentScaleY });
              }
              console.log(`Adding ${animation.type} animation for element ${element.id}`);
              this.animationTimeLine.add({
                duration: duration,
                targets: fabricObject,
                keyframes,
                easing: 'linear',
                loop: true
              }, timeEndOfSlideIn);
            }
          }
          break;
        }
      }
    });
  
    this.animationTimeLine.pause();
    this.animationTimeLine.seek(this.currentTimeInMs);
    console.log('Animations refreshed:', this.animationTimeLine);
    this.makeElementsEditable();
  }

  removeAnimation(id: string) {
    this.animations = this.animations.filter(
      (animation) => animation.id !== id
    );
    this.refreshAnimations();
  }

  setSelectedElement(selectedElement: EditorElement | null) {
    this.selectedElement = selectedElement;
    if (this.canvas) {
      if (selectedElement?.fabricObject) {
        this.canvas.setActiveObject(selectedElement.fabricObject);
        this.canvas.renderAll();
      } else {
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
      }
    }
  }

  updateSelectedElement() {
    this.selectedElement = this.editorElements.find((element) => element.id === this.selectedElement?.id) ?? null;
  }

  setEditorElements(editorElements: EditorElement[]) {
    this.editorElements = editorElements;
    this.updateSelectedElement();
    this.refreshElements();
    // this.refreshAnimations();
  }

  updateEditorElement(editorElement: EditorElement) {
    this.setEditorElements(this.editorElements.map((element) =>
      element.id === editorElement.id ? editorElement : element
    ));
  }

  updateEditorElementTimeFrame(editorElement: EditorElement, timeFrame: Partial<TimeFrame>) {
    if (timeFrame.start != undefined && timeFrame.start < 0) {
      timeFrame.start = 0;
    }
    if (timeFrame.end != undefined && timeFrame.end > this.maxTime) {
      timeFrame.end = this.maxTime;
    }
    const newEditorElement = {
      ...editorElement,
      timeFrame: {
        ...editorElement.timeFrame,
        ...timeFrame,
      }
    }
    this.updateVideoElements();
    this.updateAudioElements();
    this.updateTextElements(this.currentTimeInMs);
    this.updateShapeElements(this.currentTimeInMs);
    this.updateEditorElement(newEditorElement);
    this.refreshAnimations();
  }


  addEditorElement(editorElement: EditorElement) {
    this.setEditorElements([...this.editorElements, editorElement]);
    this.refreshElements();
    this.setSelectedElement(this.editorElements[this.editorElements.length - 1]);
  }

  removeEditorElement(id: string) {
    this.setEditorElements(this.editorElements.filter(
      (editorElement) => editorElement.id !== id
    ));
    this.refreshElements();
  }

  setMaxTime(maxTime: number) {
    this.maxTime = maxTime;
  }


  setPlaying(playing: boolean) {
    if (playing) {
      this.play();
    } else {
      this.pause();
    }
  }
  
  play() {
    this.playing = true;
    this.startedTimePlay = Date.now() - this.currentTimeInMs;
    this.animationTimeLine.play();
    this.updateElementsVisibility(this.currentTimeInMs);
    this.canvas?.renderAll();
  }
  
  pause() {
    this.playing = false;
    this.animationTimeLine.pause();
    this.updateElementsVisibility(this.currentTimeInMs);
    this.canvas?.renderAll();
  }
  
  stop() {
    this.playing = false;
    this.animationTimeLine.pause();
    this.animationTimeLine.seek(0);
    this.setCurrentTimeInMs(0);
    this.updateElementsVisibility(0);
    this.refreshAnimations();
    this.canvas?.renderAll();
  }

  startedTime = 0;
  startedTimePlay = 0;

  updateTimeTo(newTime: number) {
    this.setCurrentTimeInMs(newTime);
    if (this.canvas) {
      this.canvas.backgroundColor = this.backgroundColor;
    }
    this.updateElementsVisibility(newTime);
    this.updateVideoElements();
    this.updateAudioElements();
    this.animationTimeLine.seek(newTime);
    this.updateShapeElements(newTime);
    this.canvas?.renderAll();
  }
  
  updateElementsVisibility(newTime: number) {
    this.editorElements.forEach(e => {
      if (!e.fabricObject) return;
      const isInside = e.timeFrame.start <= newTime && newTime <= e.timeFrame.end;
      e.fabricObject.visible = isInside;
    });
  }

handleSeek(seek: number) {
  if (this.playing) {
    this.setPlaying(false);
  }
  this.updateTimeTo(seek);
  this.updateVideoElements();
  this.updateAudioElements();
}

  addVideo(index: number) {
    const videoElement = document.getElementById(`video-${index}`)
    if (!isHtmlVideoElement(videoElement)) {
      return;
    }
    const videoDurationMs = videoElement.duration * 1000;
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const id = getUid();
    this.addEditorElement(
      {
        id,
        name: `Media(video) ${index + 1}`,
        type: "video",
        placement: {
          x: 0,
          y: 0,
          width: 100 * aspectRatio,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: videoDurationMs,
        },
        properties: {
          elementId: `video-${id}`,
          src: videoElement.src,
          effect: {
            type: "none",
          }
        },
      },
    );
  }

  addImage(index: number) {
    const imageElement = document.getElementById(`image-${index}`)
    if (!isHtmlImageElement(imageElement)) {
      return;
    }
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const id = getUid();
    this.addEditorElement(
      {
        id,
        name: `Media(image) ${index + 1}`,
        type: "image",
        placement: {
          x: 0,
          y: 0,
          width: 100 * aspectRatio,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: this.maxTime,
        },
        properties: {
          elementId: `image-${id}`,
          src: imageElement.src,
          effect: {
            type: "none",
          }
        },
      },
    );
  }

  addAudio(index: number) {
    const audioElement = document.getElementById(`audio-${index}`)
    if (!isHtmlAudioElement(audioElement)) {
      return;
    }
    const audioDurationMs = audioElement.duration * 1000;
    const id = getUid();
    this.addEditorElement(
      {
        id,
        name: `Media(audio) ${index + 1}`,
        type: "audio",
        placement: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: audioDurationMs,
        },
        properties: {
          elementId: `audio-${id}`,
          src: audioElement.src,
        }
      },
    );

  }
  addText(options: {
    text: string,
    fontSize: number,
    fontWeight: number,
  }) {
    const id = getUid();
    const index = this.editorElements.length;
    this.addEditorElement(
      {
        id,
        name: `Text ${index + 1}`,
        type: "text",
        placement: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: this.maxTime,
        },
        properties: {
          text: options.text,
          fontSize: options.fontSize,
          fontWeight: options.fontWeight,
          splittedTexts: [],
        },
      },
    );
  }

  updateTextElements(newTime: number) {
    this.editorElements.filter(e => e.type === 'text').forEach(e => {
      if (!e.fabricObject) return;
      const isInside = e.timeFrame.start <= newTime && newTime <= e.timeFrame.end;
      e.fabricObject.visible = isInside;
    });
  }
  
  updateShapeElements(newTime: number) {
    this.editorElements.filter(e => e.type === 'shape').forEach(e => {
      if (!e.fabricObject) return;
      const isInside = e.timeFrame.start <= newTime && newTime <= e.timeFrame.end;
      e.fabricObject.visible = isInside;
      if (isInside) {
        const animation = this.animations.find(a => a.targetId === e.id && a.type === 'shape');
        if (animation) {
          const animationStart = animation.properties.startTime || e.timeFrame.start;
          const animationEnd = animation.properties.endTime || e.timeFrame.end;
          if (newTime >= animationStart && newTime <= animationEnd) {
            const progress = (newTime - animationStart) / (animationEnd - animationStart);
            this.animationTimeLine.seek(animationStart + progress * (animationEnd - animationStart));
          }
        }
      }
    });
    this.canvas?.renderAll();
  }
  

  updateVideoElements() {
    this.editorElements.filter(
      (element): element is VideoEditorElement =>
        element.type === "video"
    )
      .forEach((element) => {
        const video = document.getElementById(element.properties.elementId);
        if (isHtmlVideoElement(video)) {
          const videoTime = (this.currentTimeInMs - element.timeFrame.start) / 1000;
          video.currentTime = videoTime;
          if (this.playing) {
            video.play();
          } else {
            video.pause();
          }
        }
      })
  }
  updateAudioElements() {
    this.editorElements.filter(
      (element): element is AudioEditorElement =>
        element.type === "audio"
    )
      .forEach((element) => {
        const audio = document.getElementById(element.properties.elementId);
        if (isHtmlAudioElement(audio)) {
          const audioTime = (this.currentTimeInMs - element.timeFrame.start) / 1000;
          audio.currentTime = audioTime;
          if (this.playing) {
            audio.play();
          } else {
            audio.pause();
          }
        }
      })
  }
  // saveCanvasToVideo() {
  //   const video = document.createElement("video");
  //   const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  //   const stream = canvas.captureStream();
  //   video.srcObject = stream;
  //   video.play();
  //   const mediaRecorder = new MediaRecorder(stream);
  //   const chunks: Blob[] = [];
  //   mediaRecorder.ondataavailable = function (e) {
  //     console.log("data available");
  //     console.log(e.data);
  //     chunks.push(e.data);
  //   };
  //   mediaRecorder.onstop = function (e) {
  //     const blob = new Blob(chunks, { type: "video/webm" });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "video.webm";
  //     a.click();
  //   };
  //   mediaRecorder.start();
  //   setTimeout(() => {
  //     mediaRecorder.stop();
  //   }, this.maxTime);

  // }

  setVideoFormat(format: 'mp4' | 'webm') {
    this.selectedVideoFormat = format;
  }

  saveCanvasToVideoWithAudio() {
    this.saveCanvasToVideoWithAudioWebmMp4();
  }

  saveCanvasToVideoWithAudioWebmMp4() {
    console.log('modified')
    let mp4 = this.selectedVideoFormat === 'mp4'
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const stream = canvas.captureStream(30);
    const audioElements = this.editorElements.filter(isEditorAudioElement)
    const audioStreams: MediaStream[] = [];
    audioElements.forEach((audio) => {
      const audioElement = document.getElementById(audio.properties.elementId) as HTMLAudioElement;
      let ctx = new AudioContext();
      let sourceNode = ctx.createMediaElementSource(audioElement);
      let dest = ctx.createMediaStreamDestination();
      sourceNode.connect(dest);
      sourceNode.connect(ctx.destination);
      audioStreams.push(dest.stream);
    });
    audioStreams.forEach((audioStream) => {
      stream.addTrack(audioStream.getAudioTracks()[0]);
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.height = 500;
    video.width = 800;
    // video.controls = true;
    // document.body.appendChild(video);
    video.play().then(() => {
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data);
        console.log("data available");

      };
      mediaRecorder.onstop = async function (e) {
        const blob = new Blob(chunks, { type: "video/webm" });

        if (mp4) {
          // lets use ffmpeg to convert webm to mp4
          const data = new Uint8Array(await (blob).arrayBuffer());
          const ffmpeg = new FFmpeg();
          const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd"
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            // workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
          });
          await ffmpeg.writeFile('video.webm', data);
          await ffmpeg.exec(["-y", "-i", "video.webm", "-c", "copy", "video.mp4"]);
          // await ffmpeg.exec(["-y", "-i", "video.webm", "-c:v", "libx264", "video.mp4"]);

          const output = await ffmpeg.readFile('video.mp4');
          const outputBlob = new Blob([output], { type: "video/mp4" });
          const outputUrl = URL.createObjectURL(outputBlob);
          const a = document.createElement("a");
          a.download = "video.mp4";
          a.href = outputUrl;
          a.click();

        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "video.webm";
          a.click();
        }
      };
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, this.maxTime);
      video.remove();
    })
  }

  refreshElements() {
    const store = this;
    if (!store.canvas || !store.canvas.getContext() || typeof store.canvas.renderAll !== 'function') { 
      console.error("Canvas is not initialized or context is not available");
      return;
    }
    const canvas = store.canvas;
  
    // Instead of clearing, remove objects that are no longer in editorElements
    const objectsToRemove = canvas.getObjects().filter(obj => 
      !store.editorElements.some(el => el.fabricObject === obj)
    );
    objectsToRemove.forEach(obj => canvas.remove(obj));
  
    for (let index = 0; index < store.editorElements.length; index++) {
      const element = store.editorElements[index];
      let fabricObject = element.fabricObject;
  
      if (!fabricObject || !canvas.contains(fabricObject)) {
        fabricObject = this.createFabricObject(element);
        if (fabricObject) {
          canvas.add(fabricObject);
          element.fabricObject = fabricObject;
        }
      }
  
      if (fabricObject) {
        try {
          fabricObject.set({
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            editable: true
          });
          fabricObject.setCoords();
  
          // Update object's position and size
          fabricObject.set({
            left: element.placement.x,
            top: element.placement.y,
            scaleX: element.placement.scaleX,
            scaleY: element.placement.scaleY,
            angle: element.placement.rotation
          });
  
          // Ensure event listeners are attached
          fabricObject.off('modified').on("modified", (e) => {
            if (!e.target) return;
            const target = e.target;
            const placement = element.placement;
            const newPlacement: Placement = {
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              width: target.getScaledWidth(),
              height: target.getScaledHeight(),
              scaleX: target.scaleX ?? placement.scaleX,
              scaleY: target.scaleY ?? placement.scaleY,
            };
            const newElement = {
              ...element,
              placement: newPlacement,
            };
            store.updateEditorElement(newElement);
          });
  
          fabricObject.off('selected').on("selected", () => {
            store.setSelectedElement(element);
          });
        } catch (error) {
          console.error("Error setting up fabric object:", error);
        }
      }
    }
  
    this.refreshAnimations();
    this.updateTimeTo(this.currentTimeInMs);
    canvas.renderAll();
    canvas.requestRenderAll();
  }
  
  private createFabricObject(element: EditorElement): fabric.Object | null {
    let fabricObject: fabric.Object | null = null;
    
    switch (element.type) {
      case "video":
        fabricObject = this.createVideoObject(element);
        break;
      case "image":
        fabricObject = this.createImageObject(element);
        break;
      case "text":
        fabricObject = this.createTextObject(element);
        break;
      case "shape":
        fabricObject = this.createShapeObject(element);
        break;
      default:
        return null;
    }
  
    if (fabricObject) {
      this.setCommonObjectProperties(fabricObject, element);
      if (element.type === 'shape' && (element as ShapeEditorElement).properties.animation !== 'none') {
        this.applyAnimation(fabricObject, (element as ShapeEditorElement).properties.animation);
      }
    }
  
    return fabricObject;
  }

  private setCommonObjectProperties(fabricObject: fabric.Object, element: EditorElement) {
    fabricObject.set({
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      editable: true,
      name: element.id,
      left: element.placement.x,
      top: element.placement.y,
      scaleX: element.placement.scaleX,
      scaleY: element.placement.scaleY,
      angle: element.placement.rotation,
    });
  }
  
  // Implement these methods in your Store class
  private createVideoObject(element: VideoEditorElement): fabric.Object | null {
    const videoElement = document.getElementById(element.properties.elementId);
    if (!isHtmlVideoElement(videoElement)) return null;
    return new fabric.CoverVideo(videoElement, {
      name: element.id,
      left: element.placement.x,
      top: element.placement.y,
      width: element.placement.width,
      height: element.placement.height,
      scaleX: element.placement.scaleX,
      scaleY: element.placement.scaleY,
      angle: element.placement.rotation,
      objectCaching: false,
      selectable: true,
      lockUniScaling: true,
      customFilter: element.properties.effect.type,
    });
  }
  
  private createImageObject(element: ImageEditorElement): fabric.Object | null {
    const imageElement = document.getElementById(element.properties.elementId);
    if (!isHtmlImageElement(imageElement)) return null;
    const fabricObject = new fabric.CoverImage(imageElement, {
      name: element.id,
      left: element.placement.x,
      top: element.placement.y,
      angle: element.placement.rotation,
      objectCaching: false,
      selectable: true,
      lockUniScaling: true,
      customFilter: element.properties.effect.type,
    });
    const image = {
      w: imageElement.naturalWidth,
      h: imageElement.naturalHeight,
    };
    fabricObject.scaleToWidth(element.placement.width);
    fabricObject.scaleToHeight(element.placement.height);
    return fabricObject;
  }
  
  private createTextObject(element: TextEditorElement): fabric.Object {
    return new fabric.Textbox(element.properties.text, {
      name: element.id,
      left: element.placement.x,
      top: element.placement.y,
      width: element.placement.width,
      scaleX: element.placement.scaleX,
      scaleY: element.placement.scaleY,
      angle: element.placement.rotation,
      fontSize: element.properties.fontSize,
      fontWeight: element.properties.fontWeight,
      fill: "#ffffff",
    });
  }
  
  private createShapeObject(element: ShapeEditorElement): fabric.Object | null {
    const shapeProps = {
      name: element.id,
      left: element.placement.x,
      top: element.placement.y,
      width: element.placement.width,
      height: element.placement.height,
      scaleX: element.placement.scaleX,
      scaleY: element.placement.scaleY,
      angle: element.placement.rotation,
      fill: element.properties.fill,
      stroke: element.properties.stroke,
      strokeWidth: element.properties.strokeWidth,
    };
  
    let fabricObject: fabric.Object | null = null;
  
    switch (element.properties.shapeType) {
      case 'rectangle':
      case 'square':
        fabricObject = new fabric.Rect(shapeProps);
        break;
      case 'circle':
        fabricObject = new fabric.Circle({
          ...shapeProps,
          radius: element.placement.width / 2,
        });
        break;
      case 'triangle':
        fabricObject = new fabric.Triangle(shapeProps);
        break;
      default:
        console.error("Unsupported shape type:", element.properties.shapeType);
        return null;
    }
  
    if (fabricObject && element.properties.animation !== 'none') {
      this.applyAnimation(fabricObject, element.properties.animation);
    }
  
    return fabricObject;
  }
  
  private applyAnimation(object: fabric.Object, animationType: ShapeAnimationType, duration: number, speed: number) {
    if (!this.canvas || animationType === 'none') return;
  
    const animationProps = getShapeAnimationProperties(animationType);
    
    const cycleDuration = 1000 / speed;
  
    return anime({
      targets: object,
      ...animationProps,
      duration: cycleDuration,
      easing: 'linear',
      loop: true,
      update: () => {
        object.setCoords();
        this.canvas?.renderAll();
      }
    });
  }
}


function getTextObjectsPartitionedByCharacters(textObject: fabric.Text, element: TextEditorElement): fabric.Text[] {
  let copyCharsObjects: fabric.Text[] = [];
  // replace all line endings with blank
  const characters = (textObject.text ?? "").split('').filter((m) => m !== '\n');
  const charObjects = textObject.__charBounds;
  if (!charObjects) return [];
  const charObjectFixed = charObjects.map((m, index) => m.slice(0, m.length - 1).map(m => ({ m, index }))).flat();
  const lineHeight = textObject.getHeightOfLine(0);
  for (let i = 0; i < characters.length; i++) {
    if (!charObjectFixed[i]) continue;
    const { m: charObject, index: lineIndex } = charObjectFixed[i];
    const char = characters[i];
    const scaleX = textObject.scaleX ?? 1;
    const scaleY = textObject.scaleY ?? 1;
    const charTextObject = new fabric.Text(char, {
      left: charObject.left * scaleX + (element.placement.x),
      scaleX: scaleX,
      scaleY: scaleY,
      top: lineIndex * lineHeight * scaleY + (element.placement.y),
      fontSize: textObject.fontSize,
      fontWeight: textObject.fontWeight,
      fill: '#fff',
    });
    copyCharsObjects.push(charTextObject);
  }
  return copyCharsObjects;
}