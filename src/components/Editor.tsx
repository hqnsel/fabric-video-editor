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
    const initCanvas = () => {
      const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
      if (!canvasElement) {
        console.error("Canvas element not found");
        return;
      }
      const canvas = new fabric.Canvas(canvasElement, {
        height: 500,
        width: 800,
        backgroundColor: "#ededed",
        selection: true,
        preserveObjectStacking: true,
      });
    
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerColor = "#00a0f5";
      fabric.Object.prototype.cornerStyle = "circle";
      fabric.Object.prototype.cornerStrokeColor = "#0063d8";
      fabric.Object.prototype.cornerSize = 10;
    
      fabric.Object.prototype.setControlsVisibility({
        mt: true, mb: true, ml: true, mr: true,
        tl: true, tr: true, bl: true, br: true,
      });
    
      canvas.on("mouse:down", function (e) {
        if (!e.target) {
          store.setSelectedElement(null);
        } else {
          const selectedElement = store.editorElements.find(el => el.fabricObject === e.target);
          if (selectedElement) {
            store.setSelectedElement(selectedElement);
          }
        }
      });
    
      canvas.on("object:modified", function(e) {
        if (e.target && store.selectedElement) {
          const updatedElement = {
            ...store.selectedElement,
            placement: {
              x: e.target.left ?? store.selectedElement.placement.x,
              y: e.target.top ?? store.selectedElement.placement.y,
              width: e.target.getScaledWidth(),
              height: e.target.getScaledHeight(),
              rotation: e.target.angle ?? store.selectedElement.placement.rotation,
              scaleX: e.target.scaleX ?? store.selectedElement.placement.scaleX,
              scaleY: e.target.scaleY ?? store.selectedElement.placement.scaleY,
            }
          };
          store.updateEditorElement(updatedElement);
        }
      });
    
      store.setCanvas(canvas);
    
      const render = () => {
        canvas.requestRenderAll();
        fabric.util.requestAnimFrame(render);
      };
    
      render();
    
      return () => {
        canvas.dispose();
      };
    };
  
    initCanvas();
  }, [store]);
  return (
    <div className="grid grid-rows-[500px_1fr_20px] grid-cols-[72px_300px_1fr_250px] h-[100svh]">
      <div className="tile row-span-2 flex flex-col">
        <Menu />
        <ShapeResourcesPanel />  {/* ShapeAdder added here for visibility */}
      </div>
      <div className="row-span-2 flex flex-col overflow-scroll">
        <Resources />
      </div><canvas id="canvas" width="800" height="500" className="h-[500px] w-[800px] row" />
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