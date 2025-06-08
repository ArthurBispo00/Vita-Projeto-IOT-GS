'use client';

import { useEffect, useState } from 'react';
import { getSensores } from './services/api';
import SensorCard from '../componetes/SensorCard';
import Image from 'next/image';
import logo from '../componetes/imagem.png';

// Definição direta do tipo Sensor aqui mesmo!
interface Sensor {
  id: string;
  local: { latitude: number; longitude: number };
  umidade: number;
  inclinacao: boolean;
  vibracao: boolean;
  mpu_deslocamento_detectado: boolean;
  chuva_24h: number;
  chuva_72h: number;
  chuva_futura: number;
  risco: string;
  timestamp: string;
}

// Header e Footer iguais ao seu código...

function Header() {
  return (
    <header className="w-full flex flex-col items-center justify-center px-4 md:px-6 py-5 border-b border-sky-900/20 bg-sky-950/70 backdrop-blur-lg shadow-md">
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-4">
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Logo VITA"
            width={70}
            height={70}
            className="rounded-full shadow-lg bg-white p-1 object-contain"
          />
          <span className="text-xl md:text-2xl font-semibold text-white tracking-tight drop-shadow">
            VITA <span className="font-light text-sky-200">|</span> Monitoramento de Risco de Deslizamento
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center text-xs text-sky-200" aria-label="Atualização automática">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
            </svg>
            Atualiza a cada 10s
          </span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full px-4 md:px-6 py-2 text-center text-xs text-sky-200 bg-transparent" aria-label="Rodapé">
      &copy; {new Date().getFullYear()} METAMIND • Sistema de Monitoramento Inteligente de Risco de Deslizamento
    </footer>
  );
}

export default function HomePage() {
  const [sensorAtual, setSensorAtual] = useState<Sensor | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data: Sensor[] = await getSensores();
      if (data.length > 0) {
        setSensorAtual(data[data.length - 1]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen min-h-screen flex flex-col bg-gradient-to-br from-sky-900 via-sky-950 to-blue-950">
      <Header />

      {/* Conteúdo central */}
      <main className="flex-1 w-full flex items-center justify-center px-2 py-4 overflow-auto">
        {sensorAtual ? (
          <div className="w-full max-w-4xl mx-auto">
            {/* 
              O SensorCard precisa aceitar props: 
              sensor: Sensor
              fullScreen?: boolean
              Se ainda não estiver assim, adapte no componente!
            */}
            <SensorCard sensor={sensorAtual} fullScreen />
          </div>
        ) : (
          <div className="w-full flex-1 flex items-center justify-center text-sky-200 text-lg animate-pulse">
            Nenhum dado disponível
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
