
import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function Loading() {
    return (
        <div className="card w-screen h-screen flex items-center justify-center ">
            <ProgressSpinner style={{width: '100px', height: '100px'}} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
        </div>
    );
}
        