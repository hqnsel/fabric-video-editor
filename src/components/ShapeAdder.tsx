// src/components/ShapeAdder.tsx
"use client";
import React, { useContext, useState } from 'react';
import { fabric } from 'fabric';
import { StoreContext } from "@/store";

const ShapeAdder = () => {
    const [selectedShape, setSelectedShape] = useState('rectangle');
    const store = useContext(StoreContext);
    const canvas = store.canvas; // Assuming canvas instance is stored in the MobX store

    const handleAddShape = () => {
        if (!canvas) {
            console.log('Canvas is not initialized yet.');
            return;
        }

        let newShape;

        switch(selectedShape) {
            case 'circle':
                newShape = new fabric.Circle({
                    radius: 30,
                    fill: 'red',
                    left: 100,
                    top: 100
                });
                break;
            case 'square':
                newShape = new fabric.Rect({
                    width: 60,
                    height: 60,
                    fill: 'blue',
                    left: 150,
                    top: 150
                });
                break;
            case 'rectangle':
                newShape = new fabric.Rect({
                    width: 80,
                    height: 40,
                    fill: 'green',
                    left: 200,
                    top: 200
                });
                break;
            case 'triangle':
                newShape = new fabric.Triangle({
                    width: 70,
                    height: 60,
                    fill: 'yellow',
                    left: 250,
                    top: 250
                });
                break;
            default:
                return; // to handle undefined shape, do nothing
        }
        canvas.add(newShape);
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
};

export default ShapeAdder;
