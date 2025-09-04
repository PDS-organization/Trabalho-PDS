import { NextResponse } from "next/server";
import path from "node:path";
import { readJsonl, writeJsonl } from "@/lib/fake-db";

export const runtime = "nodejs";
const ACTIVITIES_FILE = path.join(process.cwd(), "src", "data", "fake_activities.jsonl");
const USERS_FILE = path.join(process.cwd(), "src", "data", "fake_users.jsonl");

async function sendWhatsAppEmail(requesterEmail: string, ownerName: string, ownerPhone: string, activity: any) {
  const whatsappMessage = encodeURIComponent(
    `Oi! Sou ${ownerName}, organizador da atividade ${activity.sport} que você se interessou. Vamos nos encontrar dia ${activity.date} às ${activity.time} em ${activity.street}. Qualquer dúvida, me chama!`
  );
  
  const whatsappUrl = `https://wa.me/55${ownerPhone.replace(/\D/g, '')}?text=${whatsappMessage}`;
  
  console.log("=== EMAIL WHATSAPP ENVIADO ===");
  console.log(`Para: ${requesterEmail}`);
  console.log(`Assunto: Atividade aceita! Dados para contato`);
  console.log(`Sua solicitação foi aceita por ${ownerName}`);
  console.log(`WhatsApp: ${whatsappUrl}`);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action"); // "accept" ou "reject"

    if (!token || !action) {
      return new Response(`
        <html><body>
          <h1>Link inválido</h1>
          <p>Este link está incorreto ou expirado.</p>
        </body></html>
      `, { 
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }

    // Lê atividades e usuários
    const activities = await readJsonl<any>(ACTIVITIES_FILE);
    const users = await readJsonl<any>(USERS_FILE);

    // Encontra a atividade e match pelo token
    let foundActivity = null;
    let foundMatch = null;
    let activityIndex = -1;

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      if (activity.matches) {
        const match = activity.matches.find((m: any) => m.token === token);
        if (match) {
          foundActivity = activity;
          foundMatch = match;
          activityIndex = i;
          break;
        }
      }
    }

    if (!foundActivity || !foundMatch) {
      return new Response(`
        <html><body>
          <h1>Match não encontrado</h1>
          <p>Este link pode ter expirado ou já foi processado.</p>
        </body></html>
      `, { 
        status: 404,
        headers: { "Content-Type": "text/html" }
      });
    }

    // Verifica se já foi respondido
    if (foundMatch.status !== "pending") {
      return new Response(`
        <html><body>
          <h1>Já processado</h1>
          <p>Esta solicitação já foi ${foundMatch.status === "accepted" ? "aceita" : "recusada"}.</p>
        </body></html>
      `, { 
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }

    // Atualiza o status
    foundMatch.status = action === "accept" ? "accepted" : "rejected";
    foundMatch.respondedAt = new Date().toISOString();

    // Se aceito, adiciona aos participants
    if (action === "accept") {
      foundActivity.participants.push({
        userId: foundMatch.userId,
        joinedAt: new Date().toISOString(),
        role: "member"
      });

      // Busca dados dos usuários para enviar WhatsApp
      const requester = users.find((u: any) => u.id === foundMatch.userId);
      const owner = users.find((u: any) => u.id === foundActivity.creatorId);

      if (requester && owner) {
        // Simula envio do WhatsApp (você precisará do telefone no schema do usuário)
        // await sendWhatsAppEmail(requester.email, owner.name, owner.phone, foundActivity);
        console.log("Enviaria dados de contato para:", requester.email);
      }
    }

    // Salva as alterações
    activities[activityIndex] = foundActivity;
    await writeJsonl(ACTIVITIES_FILE, activities);

    // Página de sucesso
    const successMessage = action === "accept" 
      ? "Solicitação aceita! O participante receberá seus dados de contato."
      : "Solicitação recusada.";

    return new Response(`
      <html>
        <head>
          <title>Resposta processada</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { color: #22c55e; }
            .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ ${successMessage}</h1>
          <div class="info">
            <strong>Atividade:</strong> ${foundActivity.title || foundActivity.sport}<br>
            <strong>Data:</strong> ${foundActivity.date} às ${foundActivity.time}<br>
            <strong>Local:</strong> ${foundActivity.street}
          </div>
          <p>Obrigado por usar nossa plataforma!</p>
        </body>
      </html>
    `, { 
      headers: { "Content-Type": "text/html" }
    });

  } catch (error) {
    console.error("Erro ao responder match:", error);
    return new Response(`
      <html><body>
        <h1>Erro interno</h1>
        <p>Ocorreu um erro ao processar sua resposta.</p>
      </body></html>
    `, { 
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}