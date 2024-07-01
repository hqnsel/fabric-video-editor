"use client";
import React from "react";
import { StoreContext } from "@/store";
import { observer } from "mobx-react";
import { AnimationResource } from "../entity/AnimationResource";
import { getUid } from "@/utils";

export const AnimationsPanel = observer(() => {
  const store = React.useContext(StoreContext);
  const selectedElement = store.selectedElement;
  const selectedElementAnimations = store.animations.filter((animation) => {
    return animation.targetId === selectedElement?.id;
  });
  const hasFadeInAnimation = selectedElementAnimations.some((animation) => {
    return animation.type === "fadeIn";
  });
  const hasFadeOutAnimation = selectedElementAnimations.some((animation) => {
    return animation.type === "fadeOut";
  });

  const hasSlideInAnimation = selectedElementAnimations.some((animation) => {
    return animation.type === "slideIn";
  });
  const hasSlideOutAnimation = selectedElementAnimations.some((animation) => {
    return animation.type === "slideOut";
  });

  const hasConsantAnimation = selectedElementAnimations.some((animation) => {
    return animation.type === "breathe";
  });

  const hasShapeAnimation = selectedElementAnimations.some((animation) => {
    return animation.type === "shape";
  });

  return (
    <>
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
        Animations
      </div>
      {selectedElement && !hasShapeAnimation && selectedElement.type === 'shape' && (
        <div
          className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
          onClick={() => {
            store.addAnimation({
              id: getUid(),
              type: "shape",
              targetId: selectedElement?.id ?? "",
              duration: 1000,
              properties: {
                animationType: selectedElement.properties.animation,
              },
            });
          }}
        >
          Add Shape Animation
        </div>
      )}
      {selectedElement && !hasFadeInAnimation && (
        <div
          className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
          onClick={() => {
            store.addAnimation({
              id: getUid(),
              type: "fadeIn",
              targetId: selectedElement?.id ?? "",
              duration: 1000,
              properties: {},
            });
          }}
        >
          Add Fade In
        </div>
      )}
      {selectedElement && !hasFadeOutAnimation && (
        <div
          className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
          onClick={() => {
            store.addAnimation({
              id: getUid(),
              type: "fadeOut",
              targetId: selectedElement?.id ?? "",
              duration: 1000,
              properties: {},
            });
          }}
        >
          Add Fade Out
        </div>
      )}
      {selectedElement && !hasSlideInAnimation && (
        <div
          className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
          onClick={() => {
            store.addAnimation({
              id: getUid(),
              type: "slideIn",
              targetId: selectedElement?.id ?? "",
              duration: 1000,
              properties: {
                direction: "left",
                useClipPath: false,
                textType: "none",
              },
            });
          }}
        >
          Add Slide In
        </div>
      )}
      {selectedElement && !hasSlideOutAnimation && (
        <div
          className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
          onClick={() => {
            store.addAnimation({
              id: getUid(),
              type: "slideOut",
              targetId: selectedElement?.id ?? "",
              duration: 1000,
              properties: {
                direction: "right",
                useClipPath: false,
                textType: "none",
              },
            });
          }}
        >
          Add Slide Out
        </div>
      )}
      {selectedElement && !hasConsantAnimation && (
        <div
          className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
          onClick={() => {
            store.addAnimation({
              id: getUid(),
              type: "breathe",
              targetId: selectedElement?.id ?? "",
              duration: 1000,
              properties: {},
            });
          }}
        >
          Add Breathing
        </div>
      )}
      {selectedElementAnimations.map((animation) => (
        <AnimationResource key={animation.id} animation={animation} />
      ))}
    </>
  );
});