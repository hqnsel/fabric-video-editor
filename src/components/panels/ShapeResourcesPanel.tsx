"use client";
import React, { useContext, useState } from "react";
import { observer } from "mobx-react";
import { StoreContext } from "@/store";
import ShapeResource from "../entity/ShapeResource";
import anime from 'animejs';

export const ShapeResourcesPanel = observer(() => {
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [fillColor, setFillColor] = useState('red');
  const [outlineColor, setOutlineColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(1);
  const [selectedAnimation, setSelectedAnimation] = useState('none');
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [transitionColor, setTransitionColor] = useState('blue');
  const store = useContext(StoreContext);
  const canvas = store.canvas;

  const handleAddShape = () => {
    if (!canvas) {
      console.log('Canvas is not initialized yet.');
      return;
    }
  
    let shapeObject = {
      type: selectedShape,
      fill: fillColor,
      stroke: outlineColor,
      strokeWidth: lineWidth,
      left: 100,
      top: 100,
      width: 80,
      height: 40,
      radius: 30,
      animation: selectedAnimation,
      transitionDuration,
      transitionColor,
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
        <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} />
        <input type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} />
        <input type="number" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} min="1" max="10" />
        <select value={selectedAnimation} onChange={e => setSelectedAnimation(e.target.value)}>
          <option value="none">None</option>
          <option value="bounce">Bounce</option>
          <option value="float">Float</option>
          <option value="rotate">Rotate</option>
          <option value="circular">Circular Motion</option>
          <option value="square">Square Motion</option>
        </select>
        <input type="number" value={transitionDuration} onChange={e => setTransitionDuration(Number(e.target.value))} min="100" max="5000" step="100" />
        <input type="color" value={transitionColor} onChange={e => setTransitionColor(e.target.value)} />
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