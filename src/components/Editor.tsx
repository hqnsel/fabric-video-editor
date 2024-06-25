"use client";
import anime from "animejs";
import { fabric } from "fabric";
import React, { useEffect, useState } from "react";
import { StoreContext } from "@/store";
import { observer } from "mobx-react";
import { Resources } from "./Resources";
import { ElementsPanel } from "./panels/ElementsPanel";
import { ShapeResourcesPanel } from "./panels/ShapeResourcesPanel";
import { Menu } from "./Menu";
import { TimeLine } from "./TimeLine";
import { Store } from "@/store/Store";
import "@/utils/fabric-utils";

export const EditorWithStore = () => {
  const [store] = useState(new Store());
  return (
    <StoreContext.Provider value={store}>
      <Editor></Editor>
    </StoreContext.Provider>
  );
}

export const Editor = observer(() => {
  const store = React.useContext(StoreContext);

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      height: 500,
      width: 800,
      backgroundColor: "#ededed",
      selection: true, // Enable group selection
    });
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "#00a0f5";
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.cornerStrokeColor = "#0063d8";
    fabric.Object.prototype.cornerSize = 10;
  
    // Enable all controls
    fabric.Object.prototype.setControlsVisibility({
      mt: true, mb: true, ml: true, mr: true,
      tl: true, tr: true, bl: true, br: true,
    });
  
    // canvas mouse down without target should deselect active object
    canvas.on("mouse:down", function (e) {
      if (!e.target) {
        store.setSelectedElement(null);
      }
    });
  
    // Update store when object is modified
    canvas.on("object:modified", function(e) {
      if (e.target && store.selectedElement) {
        const updatedElement = {
          ...store.selectedElement,
          placement: {
            x: e.target.left || 0,
            y: e.target.top || 0,
            width: e.target.width || 0,
            height: e.target.height || 0,
            rotation: e.target.angle || 0,
            scaleX: e.target.scaleX || 1,
            scaleY: e.target.scaleY || 1,
          }
        };
        store.updateEditorElement(updatedElement);
      }
    });
  
    store.setCanvas(canvas);
  
    // Adding the rectangle and applying the animation
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 50,
      height: 50,
      selectable: true,
      hasControls: true,
    });
    canvas.add(rect);
    anime({
      targets: rect,
      left: 400,
      easing: 'easeInOutQuad',
      loop: true,
      direction: 'alternate',
      duration: 3000,
      update: function() {
        rect.setCoords();
        canvas.requestRenderAll();
      }
    });
  
    fabric.util.requestAnimFrame(function render() {
      canvas.renderAll();
      fabric.util.requestAnimFrame(render);
    });
  }, []);
  return (
    <div className="grid grid-rows-[500px_1fr_20px] grid-cols-[72px_300px_1fr_250px] h-[100svh]">
      <div className="tile row-span-2 flex flex-col">
        <Menu />
        <ShapeResourcesPanel />  {/* ShapeAdder added here for visibility */}
      </div>
      <div className="row-span-2 flex flex-col overflow-scroll">
        <Resources />
      </div>
      <div id="grid-canvas-container" className="col-start-3 bg-slate-100 flex justify-center items-center">
        <canvas id="canvas" className="h-[500px] w-[800px] row" />
      </div>
      <div className="col-start-4 row-start-1">
        <ElementsPanel />
      </div>
      <div className="col-start-3 row-start-2 col-span-2 relative px-[10px] py-[4px] overflow-scroll">
        <TimeLine />
      </div>
      <div className="col-span-4 text-right px-2 text-[0.5em] bg-black text-white">
        Crafted By Amit Digga
      </div>
    </div>
  );
});