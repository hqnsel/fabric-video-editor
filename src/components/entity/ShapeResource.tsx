// src/components/entity/ShapeResource.tsx
"use client";
import React from 'react';
import { observer } from 'mobx-react';

const ShapeResource = observer(({ shape }) => {
    if (!shape) {
        return <p>Shape data is missing!</p>;
    }

    return (
        <div style={{ padding: '10px', margin: '5px', border: '1px solid gray', borderRadius: '5px' }}>
            <p>Type: {shape.type}</p>
            <div style={{ backgroundColor: shape.properties.fill, width: '50px', height: '50px' }}></div>
        </div>
    );
});

export default ShapeResource;