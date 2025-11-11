import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStep, BusStop, OptimizationResult, Point, Rect, Scenario } from './types';
import { getFukutsuGtfsData } from './services/gtfsService';
import { generateScenarios, findOptimalScenario } from './services/geminiService';

// --- Helper Functions ---
const isStopInRect = (stop: BusStop, rect: Rect): boolean => {
    const { x, y } = stop.position;
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
};

// --- UI Building Blocks (Shadcn-like) ---
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-card text-card-foreground border rounded-lg shadow-sm ${className}`}>{children}</div>
);
const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <div className={`p-4 pb-2 ${className}`}>{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <h3 className={`text-base font-semibold tracking-tight ${className}`}>{children}</h3>;
const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <div className={`p-4 pt-0 ${className}`}>{children}</div>;
const Button: React.FC<{ children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: 'primary' | 'secondary'; className?: string; }> = ({ children, onClick, disabled = false, variant = 'primary', className = '' }) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    };
    return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${variants[variant]} ${className}`}>{children}</button>;
};
const LoadingSpinner: React.FC = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>;

// --- App-specific Components ---

const VerticalStepper: React.FC<{ step: AppStep }> = ({ step }) => {
    const steps = ['エリア選択', 'シナリオ生成', 'シミュレーション', '結果確認'];

    return (
        <aside className="p-4">
            <nav>
                <ol className="relative border-l border-border">
                    {steps.map((name, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = step > stepNumber;
                        const isCurrent = step === stepNumber;
                        return (
                            <li key={name} className="mb-8 ml-6">
                                <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-background ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                    {isCompleted ? (
                                        <svg className="w-3 h-3 text-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917 5.724 10.5 15 1.5"/></svg>
                                    ) : (
                                        <span className={`${isCurrent ? 'text-primary-foreground' : 'text-secondary-foreground'}`}>{stepNumber}</span>
                                    )}
                                </span>
                                <h3 className={`font-medium leading-tight ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{name}</h3>
                                <p className="text-sm text-muted-foreground">{`ステップ ${stepNumber}`}</p>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </aside>
    );
};

const MapArea: React.FC<{ onAreaSelect: (selectedStops: BusStop[]) => void; busStops: BusStop[]; routePath: Point[]; }> = ({ onAreaSelect, busStops, routePath }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [selectionRect, setSelectionRect] = useState<Rect | null>(null);

    const getCoords = (e: React.MouseEvent): Point => {
        if (!mapRef.current) return { x: 0, y: 0 };
        const rect = mapRef.current.getBoundingClientRect();
        return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const point = getCoords(e);
        setStartPoint(point);
        setSelectionRect({ ...point, width: 0, height: 0 });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !startPoint) return;
        const currentPoint = getCoords(e);
        setSelectionRect({
            x: Math.min(startPoint.x, currentPoint.x),
            y: Math.min(startPoint.y, currentPoint.y),
            width: Math.abs(startPoint.x - currentPoint.x),
            height: Math.abs(startPoint.y - currentPoint.y),
        });
    };
    const handleMouseUp = () => {
        if (selectionRect && (selectionRect.width > 1 || selectionRect.height > 1)) {
            onAreaSelect(busStops.filter(stop => isStopInRect(stop, selectionRect)));
        } else {
            onAreaSelect([]);
        }
        setIsDrawing(false);
        setStartPoint(null);
        setSelectionRect(null);
    };

    return (
        <div ref={mapRef} className="relative w-full h-full bg-muted/40 rounded-lg shadow-inner overflow-hidden cursor-crosshair select-none" style={{backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px'}} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            {selectionRect && <div className="absolute border-2 border-primary bg-primary/20" style={{ left: `${selectionRect.x}%`, top: `${selectionRect.y}%`, width: `${selectionRect.width}%`, height: `${selectionRect.height}%` }} />}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d={`M ${routePath.map(p => `${p.x} ${p.y}`).join(' L ')}`} stroke="#E26B0A" strokeWidth="0.5" fill="none" />
            </svg>
            {busStops.map(stop => (
                <div key={stop.id} className="absolute group" style={{ left: `${stop.position.x}%`, top: `${stop.position.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-2 h-2 bg-blue-600 rounded-full border border-white shadow transition-transform group-hover:scale-150"></div>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap">{stop.name}</div>
                </div>
            ))}
        </div>
    );
};

const BottomPanel: React.FC<{
  step: AppStep;
  selectedStops: BusStop[];
  scenarios: Scenario[] | null;
  result: OptimizationResult | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onSimulate: () => void;
}> = ({ step, selectedStops, scenarios, result, isLoading, error, onGenerate, onSimulate }) => {
  return (
    <div className="col-span-2 p-4 pt-0">
      <Card>
        {error && (
            <div className="p-4 text-sm text-destructive font-medium border-b border-destructive/20 bg-destructive/10">
                {error}
            </div>
        )}
        
        {step === 1 && (
          <>
            <CardHeader><CardTitle>ステップ1: 改善エリアの選択</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                シミュレーションを開始するには、まず地図上で改善したいエリアを選択してください。地図上をドラッグして四角で囲むと、エリア内のバス停が自動で選択されます。
              </p>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader><CardTitle>ステップ2: シナリオ生成</CardTitle></CardHeader>
            <CardContent>
              <h4 className="font-semibold text-sm mb-2 text-secondary-foreground">選択されたバス停:</h4>
              {selectedStops.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                  {selectedStops.map(s => <li key={s.id}>{s.name}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground mb-4">バス停が選択されていません。</p>}
              <Button onClick={onGenerate} disabled={isLoading || selectedStops.length === 0} className="w-full">
                {isLoading ? <LoadingSpinner/> : 'シナリオを生成'}
              </Button>
            </CardContent>
          </>
        )}

        {step === 3 && scenarios && (
          <>
            <CardHeader><CardTitle>ステップ3: シミュレーション</CardTitle></CardHeader>
            <CardContent>
              <h4 className="font-semibold text-sm mb-2 text-secondary-foreground">生成された改善シナリオ:</h4>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 mb-4 border rounded-md p-2 bg-muted/50">
                  {scenarios.map(s => (
                      <div key={s.id} className="p-2 bg-background border-b last:border-b-0">
                          <p className="font-semibold text-secondary-foreground text-sm">{s.id}. {s.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                      </div>
                  ))}
              </div>
              <Button onClick={onSimulate} disabled={isLoading} className="w-full">
                {isLoading ? <LoadingSpinner/> : 'SDTでシミュレーション'}
              </Button>
            </CardContent>
          </>
        )}
        
        {step === 4 && result && scenarios && (
          <>
            <CardHeader><CardTitle className="text-green-800">ステップ4: シミュレーション結果</CardTitle></CardHeader>
             <CardContent>
                 <h4 className="font-bold text-sm text-green-900">最適なシナリオ:</h4>
                <div className="mt-2 p-3 bg-white border border-green-200 rounded-lg shadow-sm">
                    <p className="font-semibold text-gray-800">{result.optimalScenarioId}. {scenarios.find(s => s.id === result.optimalScenarioId)?.title}</p>
                </div>
                <h4 className="font-bold text-sm text-green-900 mt-4">選定理由:</h4>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{result.justification}</p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
    const [step, setStep] = useState<AppStep>(1);
    const [selectedStops, setSelectedStops] = useState<BusStop[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gtfsData, setGtfsData] = useState<{ busStops: BusStop[], routePath: Point[] } | null>(null);

    useEffect(() => {
        const data = getFukutsuGtfsData();
        setGtfsData(data);
    }, []);

    const resetState = () => {
        setStep(1);
        setSelectedStops([]);
        setScenarios(null);
        setResult(null);
        setIsLoading(false);
        setError(null);
    };

    const handleAreaSelect = useCallback((stops: BusStop[]) => {
        if (stops.length > 0) {
            setSelectedStops(stops);
            setStep(2);
            setError(null);
        } else {
            setSelectedStops([]);
            setStep(1);
        }
    }, []);

    const handleGenerateScenarios = async () => {
        if (selectedStops.length === 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const generated = await generateScenarios(selectedStops);
            setScenarios(generated);
            setStep(3);
        } catch (e) {
            setError(e instanceof Error ? e.message : '不明なエラーが発生しました。');
            setStep(2);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulate = async () => {
        if (!scenarios) return;
        setIsLoading(true);
        setError(null);
        try {
            const optimal = await findOptimalScenario(scenarios);
            setResult(optimal);
            setStep(4);
        } catch (e) {
            setError(e instanceof Error ? e.message : '不明なエラーが発生しました。');
            setStep(3);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <header className="flex items-center justify-between p-4 border-b">
                <div>
                    <h1 className="text-xl font-bold text-foreground">バスルート最適化シミュレーター</h1>
                    <p className="text-sm text-muted-foreground">福岡県福津市「ふくつミニバス」改善案の生成・評価</p>
                </div>
                <Button onClick={resetState} variant="secondary">リセット</Button>
            </header>

            <main className="flex-grow h-[calc(100vh-73px)]">
                <div className="grid grid-cols-[280px_1fr] grid-rows-[1fr_auto] h-full">
                    <VerticalStepper step={step} />
                    <div className="p-4 h-full min-h-0">
                       {gtfsData ? (
                            <MapArea 
                                onAreaSelect={handleAreaSelect} 
                                busStops={gtfsData.busStops} 
                                routePath={gtfsData.routePath}
                            />
                        ) : (
                            <div className="w-full h-full bg-muted/40 rounded-lg flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        )}
                    </div>
                    <BottomPanel 
                        step={step} 
                        selectedStops={selectedStops} 
                        scenarios={scenarios} 
                        result={result} 
                        isLoading={isLoading} 
                        error={error} 
                        onGenerate={handleGenerateScenarios} 
                        onSimulate={handleSimulate} 
                    />
                </div>
            </main>
        </div>
    );
}