// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simula um banco de dados em memória (em produção, será substituído pelo backend Java)
const activities: any[] = [];

// Função para gerar UUID simples
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Função para obter UF a partir do CEP (mock simples)
function getUfFromCep(cep: string): string {
  // Mock simples - em produção, você usaria uma API de CEP real
  const firstDigit = parseInt(cep.charAt(0));
  
  // Mapeamento aproximado baseado nos primeiros dígitos do CEP
  if (firstDigit >= 0 && firstDigit <= 1) return 'SP';
  if (firstDigit === 2) return 'RJ';
  if (firstDigit === 3) return 'MG';
  if (firstDigit === 4) return 'RS';
  if (firstDigit === 5) return 'PR';
  if (firstDigit === 6) return 'GO';
  if (firstDigit === 7) return 'DF';
  if (firstDigit === 8) return 'PE';
  if (firstDigit === 9) return 'CE';
  
  return 'SP'; // default
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    const { sport, date, time, cep, street, title, notes, capacity } = body;
    
    if (!sport || !date || !time || !cep) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: sport, date, time, cep' },
        { status: 400 }
      );
    }

    // Simula o ID do usuário atual (em produção, viria da sessão/token)
    const currentUserId = '11111111-1111-1111-1111-111111111111'; // ID do seu user de teste
    
    // Cria a nova atividade
    const newActivity = {
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      creatorId: currentUserId,
      sport,
      date,
      time,
      cep: cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"), // Formata CEP
      uf: getUfFromCep(cep),
      street: street || null,
      title: title || null,
      notes: notes || null,
      capacity: capacity || null,
      status: 'open',
      participants: [
        {
          userId: currentUserId,
          joinedAt: new Date().toISOString(),
          role: 'owner'
        }
      ],
      matches: []
    };

    // Adiciona à "base de dados" em memória
    activities.push(newActivity);

    // Log para debug
    console.log('Nova atividade criada:', newActivity);

    return NextResponse.json(newActivity, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para listar atividades (para futuras funcionalidades)
  const { searchParams } = new URL(request.url);
  
  // Filtros opcionais
  const sport = searchParams.get('sport');
  const cep = searchParams.get('cep');
  const date = searchParams.get('date');
  
  let filteredActivities = [...activities];
  
  if (sport) {
    filteredActivities = filteredActivities.filter(a => a.sport === sport);
  }
  
  if (cep) {
    // Filtro simples por CEP (em produção, seria por proximidade)
    filteredActivities = filteredActivities.filter(a => a.cep === cep);
  }
  
  if (date) {
    filteredActivities = filteredActivities.filter(a => a.date === date);
  }
  
  // Ordena por data/horário
  filteredActivities.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });
  
  return NextResponse.json(filteredActivities);
}