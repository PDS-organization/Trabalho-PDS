// /api/matches/route.ts - Criar novo match
import { NextResponse } from "next/server";
import path from "node:path";
import { readJsonl, writeJsonl } from "@/lib/fake-db";
import crypto from "crypto";

export const runtime = "nodejs";
const ACTIVITIES_FILE = path.join(process.cwd(), "src", "data", "fake_activities.jsonl");
const USERS_FILE = path.join(process.cwd(), "src", "data", "fake_users.jsonl");

// Função para enviar email (placeholder)
async function sendMatchEmail(ownerEmail: string, requesterName: string, activity: any, token: string) {
  // Aqui você implementaria o envio real do email
  // Usando Resend, NodeMailer, etc.
  console.log("=== EMAIL ENVIADO ===");
  console.log(`Para: ${ownerEmail}`);
  console.log(`Assunto: Nova solicitação - ${activity.title}`);
  console.log(`${requesterName} quer participar da atividade ${activity.sport}`);
  console.log(`Links:`);
  console.log(`Aceitar: ${process.env.NEXT_PUBLIC_APP_URL}/api/matches/respond?token=${token}&action=accept`);
  console.log(`Recusar: ${process.env.NEXT_PUBLIC_APP_URL}/api/matches/respond?token=${token}&action=reject`);
}

export async function POST(req: Request) {
  try {
    const { activityId, requesterId } = await req.json();

    if (!activityId || !requesterId) {
      return NextResponse.json(
        { error: "activityId e requesterId são obrigatórios" },
        { status: 400 }
      );
    }

    // Lê atividades e usuários
    const activities = await readJsonl<any>(ACTIVITIES_FILE);
    const users = await readJsonl<any>(USERS_FILE);

    // Encontra a atividade
    const activityIndex = activities.findIndex((a: any) => a.id === activityId);
    if (activityIndex === -1) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    const activity = activities[activityIndex];

    // Verifica se não é o próprio dono
    if (activity.creatorId === requesterId) {
      return NextResponse.json(
        { error: "Você não pode solicitar match na sua própria atividade" },
        { status: 400 }
      );
    }

    // Verifica se já existe match pendente/aceito deste usuário
    const existingMatch = activity.matches?.find((m: any) => 
      m.userId === requesterId && (m.status === "pending" || m.status === "accepted")
    );

    if (existingMatch) {
      return NextResponse.json(
        { error: "Você já tem uma solicitação para esta atividade" },
        { status: 400 }
      );
    }

    // Verifica capacidade
    const acceptedParticipants = activity.participants?.length || 0;
    if (activity.capacity && acceptedParticipants >= activity.capacity) {
      return NextResponse.json(
        { error: "Atividade lotada" },
        { status: 400 }
      );
    }

    // Gera token único para o match
    const token = crypto.randomBytes(32).toString('hex');

    // Cria o match
    const newMatch = {
      userId: requesterId,
      status: "pending",
      requestedAt: new Date().toISOString(),
      token,
      respondedAt: null
    };

    // Adiciona o match ao array
    if (!activity.matches) {
      activity.matches = [];
    }
    activity.matches.push(newMatch);

    // Atualiza o arquivo
    activities[activityIndex] = activity;
    await writeJsonl(ACTIVITIES_FILE, activities);

    // Busca dados do solicitante e do dono
    const requester = users.find((u: any) => u.id === requesterId);
    const owner = users.find((u: any) => u.id === activity.creatorId);

    if (!requester || !owner) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Envia email para o dono
    await sendMatchEmail(owner.email, requester.name, activity, token);

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada! O organizador receberá um email para aceitar ou recusar."
    });

  } catch (error) {
    console.error("Erro ao criar match:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}