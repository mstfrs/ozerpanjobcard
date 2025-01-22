
import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function Loading() {
    return (
            <ProgressSpinner style={{width: '100px', height: '100px'}} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
    );
}
        