"use client";
import React, { useContext, useState } from "react";
import { observer } from "mobx-react";
import { StoreContext } from "@/store";
import ShapeResource from "../entity/ShapeResource";

export const ShapeResourcesPanel = observer(() => {
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const store = useContext(StoreContext);
  const canvas = store.canvas;

  const handleAddShape = () => {
    if (!canvas) {
      console.log('Canvas is not initialized yet.');
      return;
    }
  
    let shapeObject = {
      type: selectedShape,
      fill: 'red', // Default fill color
      left: 100, // Default position
      top: 100,
      width: 80,
      height: 40,
      radius: 30, // Only used for circle
    };
  
    if (selectedShape === 'circle') {
      delete shapeObject.width;
      delete shapeObject.height;
    } else if (selectedShape === 'square') {
      shapeObject.width = 60;
      shapeObject.height = 60;
    } else if (selectedShape === 'triangle') {
      shapeObject.width = 70;
      shapeObject.height = 60;
    }
  
    store.addShapeResource(shapeObject);
  };

  return (
    <div>
      <div style={{ margin: '20px' }}>
        <select value={selectedShape} onChange={e => setSelectedShape(e.target.value)}>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="rectangle">Rectangle</option>
          <option value="triangle">Triangle</option>
        </select>
        <button onClick={handleAddShape}>Add Shape</button>
      </div>
      <div>
        {store.editorElements.filter(el => el.type === 'shape').map((shape, index) => (
          <ShapeResource key={shape.id} shape={shape} />
        ))}
      </div>
    </div>
  );
});