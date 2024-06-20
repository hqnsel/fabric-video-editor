// src/components/ShapeAdder.tsx
"use client";
import React, { useContext, useState } from 'react';
import { fabric } from 'fabric';
import { observer } from 'mobx-react';
import { StoreContext } from "@/store";

const ShapeAdder = observer(() => {
    const [selectedShape, setSelectedShape] = useState('rectangle');
    const store = useContext(StoreContext);
    const canvas = store.canvas;

    const handleAddShape = () => {
        if (!canvas) {
            console.log('Canvas is not initialized yet.');
            return;
        }

        let properties = {
            fill: 'red', // Default fill color
            left: 100, // Default position
            top: 100  // Default position
        };

        switch(selectedShape) {
            case 'circle':
                properties.radius = 30; // Specific property for circle
                var newShape = new fabric.Circle(properties);
                break;
            case 'square':
                properties.width = 60;
                properties.height = 60;
                var newShape = new fabric.Rect(properties);
                break;
            case 'rectangle':
                properties.width = 80;
                properties.height = 40;
                var newShape = new fabric.Rect(properties);
                break;
            case 'triangle':
                properties.width = 70;
                properties.height = 60;
                var newShape = new fabric.Triangle(properties);
                break;
            default:
                return; // Handle undefined shape
        }

        canvas.add(newShape);
        canvas.renderAll();

        store.addShapeResource({
            type: selectedShape,
            fill: properties.fill,
            left: properties.left,
            top: properties.top,
            width: properties.width || properties.radius * 2,
            height: properties.height || properties.radius * 2,
            radius: properties.radius
        });
    };

    return (
        <div style={{ margin: '20px' }}>
            <select value={selectedShape} onChange={e => setSelectedShape(e.target.value)}>
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="rectangle">Rectangle</option>
                <option value="triangle">Triangle</option>
            </select>
            <button onClick={handleAddShape}>Add Shape</button>
        </div>
    );
});

export default ShapeAdder;
