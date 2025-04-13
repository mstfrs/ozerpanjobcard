import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function Loading() {
    return (
        <div className="flex justify-center items-center w-full h-full min-h-[calc(100vh-100px)]">
            <ProgressSpinner style={{width: '100px', height: '100px'}} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
        </div>
    );
}
        