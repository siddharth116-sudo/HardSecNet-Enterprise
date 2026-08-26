import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Server, Laptop, ChevronDown, Check, Globe } from 'lucide-react';

const NodeSelector = ({ nodes, selectedNode, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNodeIcon = (name) => {
        if (name === 'LOCALHOST' || name.includes('SERVER')) return <Server className="w-4 h-4" style={{ color: 'var(--hsn-accent)' }} />;
        return <Laptop className="w-4 h-4" style={{ color: 'var(--hsn-accent)' }} />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--hsn-surface)', border: `1px solid ${isOpen ? 'var(--hsn-accent)' : 'var(--hsn-border)'}`, color: 'var(--hsn-text)' }}
            >
                <div className="flex items-center gap-2 truncate">
                    {getNodeIcon(selectedNode)}
                    <span className="truncate">{selectedNode}</span>
                </div>
                <ChevronDown className="w-4 h-4 transition-transform" style={{ color: 'var(--hsn-text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-2 w-full z-50">
                    <div className="hsn-card overflow-hidden" style={{ background: 'var(--hsn-surface)' }}>
                        <div className="px-3 py-2 text-[11px] font-medium" style={{ color: 'var(--hsn-text-dim)' }}>
                            Select target system
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                            {nodes.map((node) => {
                                const isSelected = node === selectedNode;
                                return (
                                    <button
                                        key={node}
                                        onClick={() => { onChange(node); setIsOpen(false); }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors"
                                        style={isSelected
                                            ? { background: 'var(--hsn-accent-weak)', color: 'var(--hsn-accent)' }
                                            : { color: 'var(--hsn-text-muted)' }}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            {getNodeIcon(node)}
                                            <span className="truncate">{node}</span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-2 text-center" style={{ borderTop: '1px solid var(--hsn-border)' }}>
                            <span className="text-[11px] flex items-center justify-center gap-1" style={{ color: 'var(--hsn-text-dim)' }}>
                                <Globe className="w-3 h-3" />
                                {nodes.length} active {nodes.length === 1 ? 'node' : 'nodes'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

NodeSelector.propTypes = {
    nodes: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedNode: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};

export default NodeSelector;
