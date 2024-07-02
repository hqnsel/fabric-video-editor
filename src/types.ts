import { fabric } from "fabric";

export type EditorElementBase<T extends string, P> = {
  readonly id: string;
  fabricObject?: fabric.Object;
  name: string;
  readonly type: T;
  placement: Placement;
  timeFrame: TimeFrame;
  properties: P;
};
export type VideoEditorElement = EditorElementBase<
  "video",
  { src: string; elementId: string; imageObject?: fabric.Image, effect: Effect }
>;
export type ImageEditorElement = EditorElementBase<
  "image",
  { src: string; elementId: string; imageObject?: fabric.Object, effect: Effect }
>;

export type AudioEditorElement = EditorElementBase<
  "audio",
  { src: string; elementId: string }
>;
export type TextEditorElement = EditorElementBase<
  "text",
  {
    text: string;
    fontSize: number;
    fontWeight: number;
    splittedTexts: fabric.Text[];
  }
>;

export type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type TimeFrame = {
  start: number;
  end: number;
};

export type EffectBase<T extends string> = {
  type: T;
}

export type BlackAndWhiteEffect = EffectBase<"none"> | 
EffectBase<"blackAndWhite"> | 
EffectBase<"sepia"> | 
EffectBase<"invert"> |
EffectBase<"saturate"> ;
export type Effect = BlackAndWhiteEffect;
export type EffecType = Effect["type"];

export type AnimationBase<T, P = {}> = {
  id: string;
  targetId: string;
  duration: number;
  type: T;
  properties: P;
}

export type ShapeAnimationType = 'rotate' | 'scale' | 'bounce' | 'float';

export type ShapeAnimation = AnimationBase<"shape", {
  animationType: ShapeAnimationType;
  startTime: number;
  endTime: number;
}>;

export type Animation =
  FadeInAnimation
  | FadeOutAnimation
  | SlideInAnimation
  | SlideOutAnimation
  | BreatheAnimation
  | ShapeAnimation;

export type MenuOption =
  | "Video"
  | "Audio"
  | "Text"
  | "Image"
  | "Export"
  | "Animation"
  | "Shape"
  | "Effect"
  | "Fill";

export type ShapeEditorElement = EditorElementBase<
  "shape",
  {
    shapeType: 'rectangle' | 'circle' | 'triangle' | 'square';
    fill: string;
    stroke: string;
    strokeWidth: number;
    animation: ShapeAnimationType | 'none';
    transitionDuration: number;
    transitionColor: string;
  }
>;

export type EditorElement =
  | VideoEditorElement
  | ImageEditorElement
  | AudioEditorElement
  | TextEditorElement
  | ShapeEditorElement;
