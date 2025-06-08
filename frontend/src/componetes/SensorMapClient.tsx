// src/components/SensorMapClient.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Map } from 'leaflet';

// Configuração do ícone do marcador
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Componente para o círculo tracejado de 200m
function CoverageCircle({ center, radius = 200 }: { center: [number, number]; radius?: number }) {
  const map = useMap();

  useEffect(() => {
    const circle = L.circle(center, {
      radius,
      color: '#3b82f6',
      fillColor: '#93c5fd',
      fillOpacity: 0.2,
      weight: 2,
      dashArray: '5, 5',
      className: 'coverage-circle'
    }).addTo(map);

    return () => {
      circle.remove();
    };
  }, [center, radius, map]);

  return null;
}

// Controlador de visualização do mapa
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function SensorMapClient({ 
  lat, 
  lon,
  radius = 60, // 200 metros por padrão
  initialZoom = 18, // Zoom mais próximo para 200m
  minZoom = 15,
  maxZoom = 20
}: { 
  lat: number; 
  lon: number;
  radius?: number;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
}) {
  const [isClient, setIsClient] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 bg-blue-400 rounded-full mb-2"></div>
          <div className="text-sm text-gray-600">Carregando mapa...</div>
        </div>
      </div>
    );
  }

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg">
        <div className="text-center">
          <div className="font-bold mb-1">⚠️ Coordenadas inválidas</div>
          <div className="text-sm">{lat.toFixed(6)}, {lon.toFixed(6)}</div>
        </div>
      </div>
    );
  }

  const position: [number, number] = [lat, lon];

  return (
    <div className="h-full w-full flex flex-col rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Cabeçalho */}
      <div className="p-3 bg-blue-50 border-b flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="font-medium text-blue-800">Monitoramento Ativo</span>
        </div>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          Raio: {radius}m
        </div>
      </div>

      {/* Controles */}
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Zoom:</span> {currentZoom} | 
          <span className="font-medium"> Lat:</span> {lat.toFixed(6)} | 
          <span className="font-medium"> Lon:</span> {lon.toFixed(6)}
        </div>
      </div>

      {/* Mapa */}
      <MapContainer
        center={position}
        zoom={initialZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom={true}
        className="flex-grow min-h-[350px]"
        zoomControl={true}
        whenCreated={(mapInstance: Map) => {
          mapRef.current = mapInstance;
          mapInstance.on('zoomend', () => {
            setCurrentZoom(mapInstance.getZoom());
          });
        }}
      >
        <MapController center={position} zoom={initialZoom} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <CoverageCircle center={position} radius={radius} />
        
        <Marker position={position}>
          <Popup className="custom-popup" minWidth={200} maxWidth={250}>
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="bg-blue-100 p-1.5 rounded mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-blue-700 text-sm">Ponto de Monitoramento</h3>
                  <div className="text-xs mt-1 space-y-1">
                    <div className="flex">
                      <span className="w-16 font-medium">Latitude:</span>
                      <span>{lat.toFixed(6)}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium">Longitude:</span>
                      <span>{lon.toFixed(6)}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium">Área:</span>
                      <span className="text-blue-600 font-medium">{radius}m de raio</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={() => mapRef.current?.setZoom(18)}
                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center"
                >
                  <span>Zoom 200m</span>
                </button>
                <button
                  onClick={() => mapRef.current?.setZoom(15)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center"
                >
                  <span>Zoom 1km</span>
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Rodapé */}
      <div className="p-2 bg-gray-50 border-t text-xs text-gray-600 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
          <span className="mr-3">Sensor</span>
          <div className="w-2 h-2 border border-blue-500 border-dashed rounded-full mr-1"></div>
          <span>Área de 200m</span>
        </div>
        <div className="text-blue-600 font-medium">{radius}m raio</div>
      </div>
    </div>
  );
}