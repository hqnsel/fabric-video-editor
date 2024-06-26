// src/components/entity/ShapeResource.tsx
"use client";
import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import anime from 'animejs';

const ShapeResource = observer(({ shape }) => {
    const shapeRef = useRef(null);

    useEffect(() => {
        if (shapeRef.current && shape.animation !== 'none') {
            let animation;
            switch (shape.animation) {
                case 'bounce':
                    animation = anime({
                        targets: shapeRef.current,
                        translateY: '20px',
                        direction: 'alternate',
                        loop: true,
                        easing: 'easeInOutQuad',
                        duration: 1000
                    });
                    break;
                case 'float':
                    animation = anime({
                        targets: shapeRef.current,
                        translateY: '10px',
                        direction: 'alternate',
                        loop: true,
                        easing: 'easeInOutSine',
                        duration: 2000
                    });
                    break;
                case 'rotate':
                    animation = anime({
                        targets: shapeRef.current,
                        rotate: '360deg',
                        loop: true,
                        easing: 'linear',
                        duration: 3000
                    });
                    break;
                case 'circular':
                    animation = anime({
                        targets: shapeRef.current,
                        translateX: [
                            { value: '20px', duration: 1000 },
                            { value: '0px', duration: 1000 },
                            { value: '-20px', duration: 1000 },
                            { value: '0px', duration: 1000 }
                        ],
                        translateY: [
                            { value: '0px', duration: 1000 },
                            { value: '20px', duration: 1000 },
                            { value: '0px', duration: 1000 },
                            { value: '-20px', duration: 1000 }
                        ],
                        loop: true
                    });
                    break;
                case 'square':
                    animation = anime({
                        targets: shapeRef.current,
                        translateX: [
                            { value: '20px', duration: 1000 },
                            { value: '20px', duration: 1000 },
                            { value: '-20px', duration: 1000 },
                            { value: '-20px', duration: 1000 }
                        ],
                        translateY: [
                            { value: '0px', duration: 1000 },
                            { value: '20px', duration: 1000 },
                            { value: '20px', duration: 1000 },
                            { value: '-20px', duration: 1000 }
                        ],
                        loop: true
                    });
                    break;
            }

            return () => animation && animation.pause();
        }
    }, [shape.animation]);

    useEffect(() => {
        if (shapeRef.current) {
            anime({
                targets: shapeRef.current,
                backgroundColor: [shape.fill, shape.transitionColor],
                duration: shape.transitionDuration,
                easing: 'easeInOutQuad'
            });
        }
    }, [shape.fill, shape.transitionColor, shape.transitionDuration]);

    if (!shape) {
        return <p>Shape data is missing!</p>;
    }

    return (
        <div ref={shapeRef} style={{
            padding: '10px',
            margin: '5px',
            border: `${shape.strokeWidth}px solid ${shape.stroke}`,
            borderRadius: shape.type === 'circle' ? '50%' : '5px',
            backgroundColor: shape.fill,
            width: shape.width || shape.radius * 2,
            height: shape.height || shape.radius * 2
        }}>
            <p>Type: {shape.type}</p>
        </div>
    );
});

export default ShapeResource;