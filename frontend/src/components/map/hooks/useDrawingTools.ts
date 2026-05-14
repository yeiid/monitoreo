import { useState, useRef, useEffect } from 'react';
import type { DrawingTool, NodeData } from '../types';

export const useDrawingTools = () => {
    const [activeTool, setActiveTool] = useState<DrawingTool>('select');
    const [isDrawingCable, setIsDrawingCable] = useState(false);
    const [cablePoints, setCablePoints] = useState<[number, number][]>([]);
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [pendingNodeType, setPendingNodeType] = useState('');
    
    const [showCableForm, setShowCableForm] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    // Refs for event listeners to avoid stale closures
    const activeToolRef = useRef<DrawingTool>(activeTool);
    const cablePointsRef = useRef<[number, number][]>(cablePoints);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { cablePointsRef.current = cablePoints; }, [cablePoints]);

    const resetDrawing = () => {
        setCablePoints([]);
        setIsDrawingCable(false);
        setShowCableForm(false);
        setActiveTool('select');
    };

    const startCableAt = (lng: number, lat: number) => {
        setActiveTool('draw_cable');
        setCablePoints([[lng, lat]]);
        setIsDrawingCable(true);
    };

    return {
        activeTool,
        setActiveTool,
        activeToolRef,
        isDrawingCable,
        setIsDrawingCable,
        cablePoints,
        setCablePoints,
        cablePointsRef,
        showAddForm,
        setShowAddForm,
        pendingLocation,
        setPendingLocation,
        pendingNodeType,
        setPendingNodeType,
        showCableForm,
        setShowCableForm,
        showTerminationModal,
        setShowTerminationModal,
        resetDrawing,
        startCableAt
    };
};
