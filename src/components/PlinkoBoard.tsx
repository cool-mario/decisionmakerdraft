import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { useWoodSound } from '@/hooks/useWoodSound';

interface PlinkoBoardProps {
  labels: string[];
  gravity: number;
  bounciness: number;
  friction: number;
  backgroundColor: string;
  onWin: (index: number) => void;
}

const PEG_ROWS = 8;
const PEGS_PER_ROW_BASE = 7;

export const PlinkoBoard = ({
  labels,
  gravity,
  bounciness,
  friction,
  backgroundColor,
  onWin,
}: PlinkoBoardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const ballsRef = useRef<Matter.Body[]>([]);
  const draggedBallRef = useRef<Matter.Body | null>(null);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 700 });
  const [winningSlot, setWinningSlot] = useState<number | null>(null);
  const { playWoodHit } = useWoodSound();
  const lastCollisionTime = useRef<Map<number, number>>(new Map());

  // Calculate dimensions based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const width = Math.min(containerWidth, 600);
        const height = Math.min(width * 1.2, 720);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create ball function
  const createBall = useCallback((x: number, y: number) => {
    if (!engineRef.current) return null;
    
    const ballRadius = dimensions.width * 0.025;
    const ball = Matter.Bodies.circle(x, y, ballRadius, {
      restitution: bounciness,
      friction: friction,
      frictionAir: 0.001,
      label: 'ball',
      render: {
        fillStyle: '#ff00ff',
        strokeStyle: '#00ffff',
        lineWidth: 2,
      },
    });
    
    Matter.World.add(engineRef.current.world, ball);
    ballsRef.current.push(ball);
    return ball;
  }, [dimensions.width, bounciness, friction]);

  // Initialize physics engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const { width, height } = dimensions;
    const pegRadius = width * 0.012;
    const slotWidth = width / 6;
    const slotHeight = height * 0.12;
    const boardTop = height * 0.15;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: gravity },
    });
    engineRef.current = engine;

    // Create renderer
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
      },
    });
    renderRef.current = render;

    // Create walls
    const wallThickness = 20;
    const walls = [
      // Bottom
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
        isStatic: true,
        render: { fillStyle: '#1a1a2e' },
      }),
      // Left wall
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { fillStyle: '#1a1a2e' },
      }),
      // Right wall
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        render: { fillStyle: '#1a1a2e' },
      }),
    ];

    // Create triangular corner deflectors
    const deflectorSize = width * 0.08;
    const leftDeflector = Matter.Bodies.fromVertices(
      deflectorSize / 2,
      boardTop + deflectorSize / 2,
      [[
        { x: 0, y: 0 },
        { x: deflectorSize, y: deflectorSize },
        { x: 0, y: deflectorSize },
      ]],
      { isStatic: true, render: { fillStyle: '#ff00ff' }, label: 'peg' }
    );
    
    const rightDeflector = Matter.Bodies.fromVertices(
      width - deflectorSize / 2,
      boardTop + deflectorSize / 2,
      [[
        { x: deflectorSize, y: 0 },
        { x: deflectorSize, y: deflectorSize },
        { x: 0, y: deflectorSize },
      ]],
      { isStatic: true, render: { fillStyle: '#ff00ff' }, label: 'peg' }
    );

    // Create pegs
    const pegs: Matter.Body[] = [];
    const pegAreaHeight = height - boardTop - slotHeight - height * 0.05;
    const rowSpacing = pegAreaHeight / (PEG_ROWS + 1);

    for (let row = 0; row < PEG_ROWS; row++) {
      const pegsInRow = row % 2 === 0 ? PEGS_PER_ROW_BASE : PEGS_PER_ROW_BASE - 1;
      const rowOffset = row % 2 === 0 ? 0 : slotWidth / 2;
      const startX = (width - (pegsInRow - 1) * slotWidth) / 2 + rowOffset;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * slotWidth - rowOffset;
        const y = boardTop + rowSpacing * (row + 1);
        
        const peg = Matter.Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          restitution: bounciness,
          label: 'peg',
          render: {
            fillStyle: '#00ffff',
            strokeStyle: '#ff00ff',
            lineWidth: 1,
          },
        });
        pegs.push(peg);
      }
    }

    // Create slot dividers
    const dividers: Matter.Body[] = [];
    const slotY = height - slotHeight / 2;
    const dividerWidth = width * 0.008;

    for (let i = 0; i <= 6; i++) {
      const x = i * slotWidth;
      const divider = Matter.Bodies.rectangle(x, slotY, dividerWidth, slotHeight, {
        isStatic: true,
        render: { fillStyle: '#ff00ff' },
      });
      dividers.push(divider);
    }

    // Create slot sensors
    const sensors: Matter.Body[] = [];
    for (let i = 0; i < 6; i++) {
      const x = slotWidth / 2 + i * slotWidth;
      const sensor = Matter.Bodies.rectangle(x, height - slotHeight / 2, slotWidth - dividerWidth * 2, slotHeight - 10, {
        isStatic: true,
        isSensor: true,
        label: `slot-${i}`,
        render: { fillStyle: 'transparent' },
      });
      sensors.push(sensor);
    }

    // Add all bodies to world
    Matter.World.add(engine.world, [...walls, leftDeflector, rightDeflector, ...pegs, ...dividers, ...sensors]);

    // Create initial ball
    const initialBall = Matter.Bodies.circle(width / 2, height * 0.08, dimensions.width * 0.025, {
      restitution: bounciness,
      friction: friction,
      frictionAir: 0.001,
      label: 'ball',
      render: {
        fillStyle: '#ff00ff',
        strokeStyle: '#00ffff',
        lineWidth: 2,
      },
    });
    Matter.Body.setStatic(initialBall, true);
    Matter.World.add(engine.world, initialBall);
    ballsRef.current = [initialBall];

    // Mouse control
    const mouse = Matter.Mouse.create(canvasRef.current);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    mouseConstraintRef.current = mouseConstraint;
    Matter.World.add(engine.world, mouseConstraint);

    // Handle mouse events for dragging
    Matter.Events.on(mouseConstraint, 'startdrag', (event: any) => {
      if (event.body?.label === 'ball') {
        draggedBallRef.current = event.body;
        Matter.Body.setStatic(event.body, true);
      }
    });

    Matter.Events.on(mouseConstraint, 'enddrag', (event: any) => {
      if (event.body?.label === 'ball' && draggedBallRef.current) {
        Matter.Body.setStatic(event.body, false);
        draggedBallRef.current = null;
      }
    });

    // Collision detection for sound and winning
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Play sound on peg collision
        if ((bodyA.label === 'ball' && bodyB.label === 'peg') ||
            (bodyA.label === 'peg' && bodyB.label === 'ball')) {
          const ball = bodyA.label === 'ball' ? bodyA : bodyB;
          const now = Date.now();
          const lastTime = lastCollisionTime.current.get(ball.id) || 0;
          
          if (now - lastTime > 50) {
            const velocity = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
            playWoodHit(Math.min(velocity / 10, 1));
            lastCollisionTime.current.set(ball.id, now);
          }
        }
        
        // Check for slot win
        const slotBody = bodyA.label?.startsWith('slot-') ? bodyA : 
                         bodyB.label?.startsWith('slot-') ? bodyB : null;
        const ballBody = bodyA.label === 'ball' ? bodyA : 
                        bodyB.label === 'ball' ? bodyB : null;
        
        if (slotBody && ballBody) {
          const slotIndex = parseInt(slotBody.label.split('-')[1]);
          setWinningSlot(slotIndex);
          onWin(slotIndex);
        }
      });
    });

    // Custom render for ball line
    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      
      ballsRef.current.forEach((ball) => {
        const { x, y } = ball.position;
        const radius = (ball as any).circleRadius || dimensions.width * 0.025;
        
        // Draw line through ball
        context.beginPath();
        context.strokeStyle = '#00ffff';
        context.lineWidth = 2;
        const angle = ball.angle;
        context.moveTo(
          x - Math.cos(angle) * radius,
          y - Math.sin(angle) * radius
        );
        context.lineTo(
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius
        );
        context.stroke();
      });

      // Draw winning slot highlight
      if (winningSlot !== null) {
        const slotX = slotWidth / 2 + winningSlot * slotWidth;
        const slotY = height - slotHeight / 2;
        
        context.fillStyle = 'rgba(0, 255, 255, 0.3)';
        context.fillRect(
          winningSlot * slotWidth + dividerWidth,
          height - slotHeight,
          slotWidth - dividerWidth * 2,
          slotHeight
        );
      }
    });

    // Start engine
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Cleanup
    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      ballsRef.current = [];
    };
  }, [dimensions, gravity, bounciness, friction, playWoodHit, onWin]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || ballsRef.current.length === 0) return;
      
      const activeBall = ballsRef.current[ballsRef.current.length - 1];
      if (!activeBall || !(activeBall as any).isStatic) return;
      
      const moveAmount = 20;
      
      switch (e.key) {
        case 'ArrowLeft':
          Matter.Body.setPosition(activeBall, {
            x: Math.max(activeBall.position.x - moveAmount, 30),
            y: activeBall.position.y,
          });
          break;
        case 'ArrowRight':
          Matter.Body.setPosition(activeBall, {
            x: Math.min(activeBall.position.x + moveAmount, dimensions.width - 30),
            y: activeBall.position.y,
          });
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          Matter.Body.setStatic(activeBall, false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dimensions.width]);

  const addBall = useCallback(() => {
    const x = dimensions.width / 2 + (Math.random() - 0.5) * 100;
    const ball = createBall(x, dimensions.height * 0.08);
    if (ball) {
      Matter.Body.setStatic(ball, true);
    }
  }, [createBall, dimensions]);

  const resetBalls = useCallback(() => {
    if (!engineRef.current) return;
    
    // Remove all balls except one
    ballsRef.current.forEach((ball) => {
      Matter.World.remove(engineRef.current!.world, ball);
    });
    ballsRef.current = [];
    
    // Create fresh ball
    const ball = createBall(dimensions.width / 2, dimensions.height * 0.08);
    if (ball) {
      Matter.Body.setStatic(ball, true);
    }
    setWinningSlot(null);
  }, [createBall, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[600px] mx-auto">
      <div 
        className="relative rounded-lg overflow-hidden border-4"
        style={{ 
          backgroundColor,
          borderColor: '#ff00ff',
          boxShadow: '0 0 30px rgba(255, 0, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)',
        }}
      >
        <canvas ref={canvasRef} className="w-full" />
        
        {/* Labels at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {labels.slice(0, 6).map((label, index) => (
            <div
              key={index}
              className={`flex-1 text-center py-2 text-xs sm:text-sm font-bold truncate px-1 transition-all ${
                winningSlot === index ? 'text-background' : 'text-cyan-400'
              }`}
              style={{
                backgroundColor: winningSlot === index ? '#00ffff' : 'transparent',
                textShadow: winningSlot === index ? 'none' : '0 0 10px #00ffff',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={addBall}
          className="px-4 py-2 rounded font-bold text-sm"
          style={{
            backgroundColor: '#ff00ff',
            color: '#000',
            boxShadow: '0 0 15px rgba(255, 0, 255, 0.7)',
          }}
        >
          Add Ball
        </button>
        <button
          onClick={resetBalls}
          className="px-4 py-2 rounded font-bold text-sm"
          style={{
            backgroundColor: '#00ffff',
            color: '#000',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.7)',
          }}
        >
          Reset
        </button>
      </div>
      
      <p className="text-center text-xs mt-2 opacity-70" style={{ color: '#00ffff' }}>
        Drag ball or use ← → arrows, then Space/Enter to drop
      </p>
    </div>
  );
};
