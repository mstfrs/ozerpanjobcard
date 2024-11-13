import React, { useEffect, useState } from 'react';

const ElapsedTimeCounter = ({ fromTime }) => {
    const [elapsedTime, setElapsedTime] = useState({ hours: '00', minutes: '00', seconds: '00' });

    useEffect(() => {
        const calculateElapsedTime = () => {
            const now = new Date();
            const startTime = new Date(fromTime);
            const difference = now - startTime;

            if (difference > 0) {
                setElapsedTime({
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'),
                    minutes: Math.floor((difference / (1000 * 60)) % 60).toString().padStart(2, '0'),
                    seconds: Math.floor((difference / 1000) % 60).toString().padStart(2, '0'),
                });
            }
        };

        const timer = setInterval(calculateElapsedTime, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, [fromTime]);

    return (
        <div className='font-semibold text-lg '>
            Süre: {elapsedTime.hours} : {elapsedTime.minutes} : {elapsedTime.seconds}
        </div>
    );
};

export default ElapsedTimeCounter;
