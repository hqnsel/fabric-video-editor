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
      type: 'shape',
      properties: {
        shapeType: selectedShape,
        fill: fillColor,
        stroke: outlineColor,
        strokeWidth: lineWidth,
        animation: selectedAnimation,
        animationType: selectedAnimation,
        transitionDuration,
        transitionColor,
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
    
    console.log('Adding shape with animation:', selectedAnimation);
    store.addShapeResource(shapeObject);
    
    if (selectedAnimation !== 'none') {
      store.addAnimation({
        id: Date.now().toString(),
        type: 'shape',
        targetId: shapeObject.id,
        duration: transitionDuration,
        properties: {
          shapeType: shapeObject.properties.shapeType,
          fill: shapeObject.properties.fill,
          stroke: shapeObject.properties.stroke,
          strokeWidth: shapeObject.properties.strokeWidth,
          animation: shapeObject.properties.animation,
          animationType: selectedAnimation,
          transitionDuration: shapeObject.properties.transitionDuration,
          transitionColor: shapeObject.properties.transitionColor,
        },
      });
    }
    
    console.log('Shape added:', shapeObject);
    console.log('Current animations:', store.animations);
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