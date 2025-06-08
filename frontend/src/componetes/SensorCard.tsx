'use client';

import dynamic from 'next/dynamic';
import { MapPin, Droplet, Activity, AlertTriangle, Info, ChevronDown, ChevronUp, CalendarDays, Waves, Move3D, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useState, useEffect, useRef } from 'react';

const SensorMap = dynamic(() => import('./SensorMapClient'), { 
  ssr: false,
  loading: () => <div className="bg-gray-100 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">Carregando mapa...</div>
});

interface Sensor {
  id: string;
  local: { latitude: number; longitude: number };
  umidade: number;
  inclinacao: boolean;
  vibracao?: boolean;
  mpu_deslocamento_detectado?: boolean;
  chuva_passada?: number;
  chuva_futura?: number;
  risco: string;
  timestamp: string;
}

interface SensorCardProps {
  sensor: Sensor;
  fullScreen?: boolean;
}

export default function SensorCard({ sensor, fullScreen = false }: SensorCardProps) {
  const { id, local, umidade, inclinacao, vibracao, mpu_deslocamento_detectado, chuva_passada, chuva_futura, risco, timestamp } = sensor;
  const [open, setOpen] = useState(fullScreen);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Determina se é risco alto
  const isHighRisk = risco === 'ALTO';
  
  // Cores de risco
  const riscoInfo = {
    ALTO: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-700',
      icon: <AlertTriangle className="text-red-600" size={18} />,
      label: 'Alto risco de deslizamento! Atenção máxima.',
    },
    MÉDIO: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      icon: <AlertTriangle className="text-yellow-500" size={18} />,
      label: 'Risco intermediário, monitoramento necessário.',
    },
    BAIXO: {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
      icon: <AlertTriangle className="text-green-600" size={18} />,
      label: 'Baixo risco no momento.',
    },
  }[risco as 'ALTO' | 'MÉDIO' | 'BAIXO'] || {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: <AlertTriangle className="text-gray-500" size={18} />,
    label: 'Sem informação de risco.',
  };

  // Forçar re-renderização do mapa quando ele se torna visível
  useEffect(() => {
    if (open || fullScreen) {
      const timer = setTimeout(() => {
        setMapLoaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setMapLoaded(false);
    }
  }, [open, fullScreen]);

  return (
    <motion.div
      layout
      animate={isHighRisk && !fullScreen ? {
        boxShadow: ["0 0 0 0 rgba(239,68,68,0.7)", "0 0 0 10px rgba(239,68,68,0)"]
      } : {}}
      transition={isHighRisk ? {
        repeat: Infinity,
        duration: 2,
        repeatType: "reverse"
      } : {}}
      whileHover={!fullScreen ? { scale: 1.02, boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)' } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      tabIndex={0}
      aria-label={`Informações do sensor ${id}`}
      className={`
        transition-all duration-300
        outline-none focus:ring-2 focus:ring-sky-300
        ${fullScreen
          ? 'w-full h-full max-w-none max-h-none rounded-none bg-white/85 border-0 flex flex-col overflow-hidden'
          : `bg-white rounded-2xl border ${isHighRisk ? 'border-red-500 shadow-red-200' : riscoInfo.border} shadow-md p-0 w-full max-w-lg mx-auto mb-6`
        }
        ${fullScreen && isHighRisk ? 'bg-red-50' : ''}
      `}
      style={fullScreen ? { minHeight: '100%', minWidth: '100%' } : undefined}
    >
      {/* Banner de alerta para risco ALTO */}
      {isHighRisk && (
        <div className="bg-red-600 text-white py-2 px-4 flex items-center justify-center">
          <AlertTriangle size={20} className="mr-2" />
          <span className="font-bold">ALERTA: ÁREA DE RISCO ATIVO!</span>
        </div>
      )}

      <div className="p-6">
        {/* Cabeçalho do painel */}
        <div className={`flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3 ${fullScreen ? 'pb-2' : ''}`}>
          <div className="flex items-center gap-2">
            <Activity className="text-sky-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight">
              VITA Sensor <span className="text-sky-700">{id}</span>
            </h2>
          </div>
          {/* Badge de risco com Tooltip */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span
                className={`flex items-center gap-1 px-4 py-1 rounded-full border font-semibold text-sm cursor-pointer select-none ${riscoInfo.bg} ${riscoInfo.text} ${riscoInfo.border} transition-all`}
                tabIndex={0}
                aria-label={riscoInfo.label}
              >
                {riscoInfo.icon} {risco}
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="top" className="z-50 px-3 py-2 bg-white border rounded-lg text-xs shadow-lg text-gray-800">
                {riscoInfo.label}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* Informações principais */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg ${fullScreen ? 'pb-2' : ''}`}>
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-gray-500" />
            <span className="truncate" title={`Lat: ${local.latitude} / Long: ${local.longitude}`}>
              <b>{local.latitude.toFixed(4)}</b>, <b>{local.longitude.toFixed(4)}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Droplet size={20} className="text-blue-400" />
            <span>
              Umidade: <b>{umidade.toFixed(1)}%</b>
            </span>
          </div>
          
          {/* Vibração (SW-420) */}
          {typeof vibracao !== "undefined" && (
            <div className="flex items-center gap-2">
              <Waves size={20} className="text-purple-400" />
              <span>
                Vibração: <b className={vibracao ? "text-red-500" : "text-green-700"}>
                  {vibracao ? "Detectada" : "Normal"}
                </b>
              </span>
            </div>
          )}
          
          {/* Deslocamento (MPU6050) */}
          {typeof mpu_deslocamento_detectado !== "undefined" && (
            <div className="flex items-center gap-2">
              <Move3D size={20} className="text-orange-500" />
              <span>
                Deslocamento: <b className={mpu_deslocamento_detectado ? "text-red-500" : "text-green-700"}>
                  {mpu_deslocamento_detectado ? "Detectado" : "Normal"}
                </b>
              </span>
            </div>
          )}
          
          {/* Inclinação */}
          <div className="flex items-center gap-2">
            <Info size={20} className="text-gray-500" />
            <span>
              Inclinação: <b className={inclinacao ? 'text-red-500' : 'text-green-700'}>
                {inclinacao ? 'Detectada' : 'Estável'}
              </b>
            </span>
          </div>
          
          {/* Chuva passada/futura */}
          {typeof chuva_passada !== "undefined" && (
            <div className="flex items-center gap-2">
              <CloudRain size={20} className="text-blue-700" />
              <span>
                Chuva 48h: <b>{chuva_passada?.toFixed(1) ?? '0'}mm</b>
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <CalendarDays size={19} className="text-gray-500" />
            <span className="text-xs">
              <span className="font-medium">Última leitura:</span>{' '}
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Seção de dados críticos */}
        <div className="mt-4">
          {/* Barra de progresso para chuva futura */}
          {typeof chuva_futura !== "undefined" && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Chuva prevista (próx. 48h):</span>
                <span className={chuva_futura > 50 ? "text-red-600 font-medium" : ""}>
                  {chuva_futura > 50 ? "Alerta!" : ""} <b>{chuva_futura?.toFixed(1) ?? '0'}mm</b>
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${chuva_futura > 50 ? 'bg-red-600' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(100, chuva_futura)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Mensagem de combinação crítica */}
          {isHighRisk && (
            <div className="md:col-span-2 flex items-center bg-red-100 p-3 rounded-lg mb-4">
              <AlertTriangle className="text-red-600 mr-2 flex-shrink-0" size={20} />
              <span className="font-medium">
                Combinação crítica detectada: Alta umidade + Inclinação + Vibração
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mapa e detalhes colapsáveis */}
      <div className={`mt-0 flex-1 px-6 pb-6 ${fullScreen ? 'flex flex-col' : ''}`}>
        {!fullScreen && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 text-sky-700 hover:underline text-base font-medium transition focus:outline-none focus:ring-1 focus:ring-sky-400 rounded px-2 py-1 mb-2"
            aria-expanded={open}
            aria-controls={`sensor-details-${id}`}
          >
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {open ? 'Ocultar detalhes' : 'Mostrar detalhes e mapa'}
          </button>
        )}
        
        <AnimatePresence>
          {(open || fullScreen) && (
            <motion.div
              key="details"
              id={`sensor-details-${id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`overflow-hidden w-full ${fullScreen ? 'flex-1 flex flex-col' : ''}`}
              style={fullScreen ? { minHeight: 0 } : undefined}
              ref={mapContainerRef}
            >
              <div className={`rounded-xl overflow-hidden ${isHighRisk ? 'border-2 border-red-300' : 'border border-gray-200'} shadow-sm bg-white ${fullScreen ? 'flex-1 min-h-[320px]' : ''}`}>
                {mapLoaded && (
                  <SensorMap 
                    lat={local.latitude} 
                    lon={local.longitude}
                    showRiskArea={isHighRisk}
                    riskRadius={150}
                    key={`${id}-${local.latitude}-${local.longitude}`}
                  />
                )}
              </div>
              
              {/* Legenda da área de risco */}
              {isHighRisk && (
                <div className="mt-2 flex items-center text-xs text-red-700 px-3 py-1 bg-red-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Área vermelha: Zona de risco (150m ao redor do sensor)
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
                <p>
                  O sensor monitora umidade, inclinação, vibração, deslocamento e dados climáticos em tempo real. Alertas de risco são gerados automaticamente por inteligência artificial.
                </p>
                <ul className="list-disc ml-5 mt-1">
                  <li>
                    <b>Umidade</b> acima de 80% e inclinação detectada elevam o risco para <span className="text-red-700 font-semibold">ALTO</span>.
                  </li>
                  <li>
                    <b>Chuva</b> forte junto com solo úmido indica risco intermediário.
                  </li>
                  <li>
                    <b>Vibração ou deslocamento</b> frequentes, junto com alta umidade ou chuva, elevam o risco.
                  </li>
                  <li>
                    <b>Todos os dados</b> são enviados a cada intervalo regular ou em caso de evento crítico.
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Informações adicionais para fullscreen */}
      {fullScreen && isHighRisk && (
        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg border-2 border-red-300 z-10">
          <h3 className="font-bold text-red-700 flex items-center">
            <AlertTriangle className="mr-2" size={18} /> Zona de Risco
          </h3>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Evacuação recomendada em 500m ao redor</li>
            <li>• Monitoramento 24h ativo</li>
            <li>• Nível de ameaça: Crítico</li>
            <li>• Defesa civil: Notificada</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
}