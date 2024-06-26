// src/components/entity/ShapeResource.tsx
"use client";
import React from 'react';
import { observer } from 'mobx-react';

const ShapeResource = observer(({ shape }) => {
    if (!shape) {
        return <p>Shape data is missing!</p>;
    }

    return (
        <div style={{
            padding: '10px',
            margin: '5px',
            border: `${shape.properties.strokeWidth}px solid ${shape.properties.stroke}`,
            borderRadius: shape.properties.shapeType === 'circle' ? '50%' : '5px',
            backgroundColor: shape.properties.fill,
            width: shape.placement.width,
            height: shape.placement.height
        }}>
            <p>Type: {shape.properties.shapeType}</p>
            <p>Animation: {shape.properties.animation}</p>
        </div>
    );
});

export default ShapeResource;