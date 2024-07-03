"use client";
import React, { useContext, useState } from "react";
import { observer } from "mobx-react";
import { StoreContext } from "@/store";
import ShapeResource from "../entity/ShapeResource";
import { getUid } from '@/utils';
import anime from 'animejs';

export const ShapeResourcesPanel = observer(() => {
  const store = useContext(StoreContext);
  const canvas = store.canvas;

  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [fillColor, setFillColor] = useState('red');
  const [outlineColor, setOutlineColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(1);
  const [selectedAnimation, setSelectedAnimation] = useState('none');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(store.maxTime);
  const [speed, setSpeed] = useState(1);

  const handleAddShape = () => {
    if (!canvas) {
      console.log('Canvas is not initialized yet.');
      return;
    }
  
    let shapeObject = {
      type: 'shape',
      properties: {
        shapeType: selectedShape,
        fill: fillColor,
        stroke: outlineColor,
        strokeWidth: lineWidth,
        animation: selectedAnimation,
      },
      placement: {
        x: 100,
        y: 100,
        width: selectedShape === 'circle' ? 60 : 80,
        height: selectedShape === 'circle' ? 60 : 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 0,
        end: store.maxTime,
      },
    };
    
    if (selectedShape === 'square') {
      shapeObject.placement.width = 60;
      shapeObject.placement.height = 60;
    } else if (selectedShape === 'triangle') {
      shapeObject.placement.width = 70;
      shapeObject.placement.height = 60;
    }
    
    const addedShape = store.addShapeResource(shapeObject);
    
    if (selectedAnimation !== 'none') {
      store.addAnimation({
        id: getUid(),
        type: "shape",
        targetId: addedShape.id,
        duration: endTime - startTime,
        properties: {
          animationType: selectedAnimation as ShapeAnimationType,
          startTime: startTime,
          endTime: endTime,
          speed: speed,
        },
      });
    }
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
        <input type="number" value={startTime} onChange={e => setStartTime(Number(e.target.value))} min="0" max={store.maxTime} step="100" />
        <input type="number" value={endTime} onChange={e => setEndTime(Number(e.target.value))} min="0" max={store.maxTime} step="100" />
        <input type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} min="0.1" max="10" step="0.1" />
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