import { useState, useRef, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Line } from 'react-konva';
import { useKey, useWindowSize } from 'rooks';
import { useHistoryTravel } from 'ahooks';

const BRUSH_STROKE_COLORS = [
  '#F62F63',
  '#3CB35A',
  '#FACC15',
  '#3B82F6',
  '#888',
  '#fff',
];

/** Components to select brushes in react konva */
const Brush = (props) => {
  const { color, onClick } = props;
  return (
    <button
      type="button"
      disabled={props.disabled}
      className="brush"
      style={{ backgroundColor: color }}
      onClick={onClick}
    />
  );
};

const Brushes = ({ setBrushStrokeColor, disabled }) => {
  return (
    <>
      {BRUSH_STROKE_COLORS.map((color, i) => (
        <Brush
          key={i}
          color={color}
          disabled={disabled}
          onClick={() => setBrushStrokeColor(color)}
        />
      ))}
    </>
  );
};

const App = () => {
  const { innerHeight, innerWidth } = useWindowSize();
  const [tool, setTool] = useState('pen');
  const {
    value: lines,
    setValue: setLines,
    back: undo,
    forward: redo,
    backLength,
    forwardLength,
  } = useHistoryTravel([]);
  const canUndo = backLength > 0;
  const canRedo = forwardLength > 0;
  const [brushStrokeColor, setBrushStrokeColor] = useState(
    BRUSH_STROKE_COLORS[0]
  );
  const isDrawing = useRef(false);

  useKey(
    'KeyZ',
    (keyboardEvent) => {
      console.log(
        'key z pressed',
        keyboardEvent.metaKey,
        keyboardEvent.shiftKey,
        keyboardEvent.ctrlKey
      );
      if (keyboardEvent.metaKey) {
        undo();
      }
    },
    {
      when: canUndo,
    }
  );

  useKey(
    'KeyY',
    (keyboardEvent) => {
      if (keyboardEvent.metaKey) {
        redo();
      }
    },
    {
      when: canRedo,
    }
  );

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([
      ...lines,
      {
        tool,
        points: [pos.x, pos.y],
        color: brushStrokeColor,
        strokeWidth: tool === 'pen' ? 5 : 100,
      },
    ]);
    console.log('setting lines');
  };

  const handleMouseMove = (e) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.slice());
  };

  useEffect(() => {
    if (tool === 'pen' && document.body.className !== 'pen') {
      document.body.className = 'pen';
    } else if (tool === 'eraser' && document.body.className !== 'eraser') {
      document.body.className = 'eraser';
    }
  }, [tool]);

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <main className="contents">
      <Stage
        width={innerWidth}
        height={innerHeight}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
      <div id="paperu-controls">
        <button
          onClick={() => {
            setTool('pen');
          }}
          data-active={tool === 'pen' ? 'true' : undefined}
          className="pen"
        >
          🖊️
        </button>
        <button
          className="eraser"
          data-active={tool === 'eraser' ? 'true' : undefined}
          onClick={() => {
            setTool('eraser');
          }}
        >
          🧽
        </button>
        <button
          className="clear"
          onClick={() => {
            setLines([]);
          }}
        >
          🗑️
        </button>
      </div>
      <div id="color-controls">
        <Brushes
          setBrushStrokeColor={setBrushStrokeColor}
          disabled={tool === 'eraser'}
        />
      </div>
    </main>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
