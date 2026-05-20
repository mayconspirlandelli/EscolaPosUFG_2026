import ChatBot from "react-chatbotify";
import "@/styles/chatbot.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRef } from "react";

const ChatEscolaPos = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

    // Conversational memory for multi-turn chat
    const chatHistory = useRef<Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>>([]);

    const CONTEXT = `
        - Inscrição e matrícula: ler edital, critérios de seleção, pagamento de taxa, assinatura de contrato.
        - Documentos: RG ou CNH, Diploma de curso superior, Contrato ou termo de compromisso assinado.
        - Pós-graduação: lato sensu (especialização profissional) e stricto sensu (pesquisa/mestrado/doutorado).
        - Periodicidade: semanal, quinzenal ou mensal.
        - Aproveitamento: disciplinas concluídas há no máximo dois anos.
        - Pagamento: Boleto bancário ou Pix.
        - Gratuidade: alguns cursos são gratuitos, verificar na página do curso.
        - Modalidade: Presencial, Híbrido e EAD.
        - Detalhes do curso: consultar página oficial ou contatos (telefone, WhatsApp, e-mail).
        - Bolsas: disponíveis para servidores UFG e grupos minorizados conforme edital.
        - Tecnólogo: diplomas são aceitos para MBA e pós-graduação.
        - Trancamento: não é possível trancamento de matrícula em Lato Sensu na UFG.
        - Mudança de curso: possível via novo processo seletivo.
        - Cancelamento: conforme regras previstas em contrato.
        - Comunicação: via sistema acadêmico, e-mail ou ambiente virtual de aprendizagem.
        - Requisitos acadêmicos: frequência mínima de 75%, nota mínima 7,0 e aprovação no TCC (se obrigatório).
        - Certificação: solicitar à coordenação após atender requisitos.
    `;

    const SYSTEM_MESSAGE =
        "Você é um assistente virtual chamado Ana especializado na Escola de Pós-Graduação da UFG e na UFG.\n\n" +
        "Instruções:\n" +
        "1. Seja direto: Dê respostas curtas e informativas.\n" +
        "2. Mantenha o foco: Responda apenas sobre a Escola de Pós-Graduação da UFG ou a UFG.\n" +
        "3. Se a pergunta não for sobre esses temas, direcione o usuário educadamente para os temas que você domina.\n" +
        "4. Use APENAS o contexto fornecido abaixo para responder.\n" +
        "5. Se a informação não estiver no contexto, diga que não sabe informar e sugira contactar a secretaria.\n\n" +
        "CONTEXTO:\n" + CONTEXT;

    const formatMessageText = (text: string) => {
        if (!text) return "";
        const parts = text.split("**");
        return (
            <span style={{ whiteSpace: "pre-wrap" }}>
                {parts.map((part, index) => {
                    if (index % 2 !== 0) {
                        return <strong key={index}>{part}</strong>;
                    }
                    return part;
                })}
            </span>
        );
    };

    const handleGeminiStream = async (params: any) => {
        try {
            console.log("Iniciando chamada ao Gemini Stream...");
            if (!apiKey) {
                console.error("VITE_GEMINI_API_KEY não encontrada.");
                await params.injectMessage("Erro: Chave de API não configurada corretamente.");
                return;
            }

            // Add user message to history
            chatHistory.current.push({
                role: "user",
                parts: [{ text: params.userInput }]
            });

            // Prevent history from growing too large (keep last 20 messages / 10 turns)
            if (chatHistory.current.length > 20) {
                chatHistory.current = chatHistory.current.slice(-20);
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_MESSAGE
            });

            // Start chat with history (excluding the current user input which will be sent via stream)
            const chat = model.startChat({
                history: chatHistory.current.slice(0, -1)
            });

            const result = await chat.sendMessageStream(params.userInput);
            let text = "";

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                text += chunkText;
                await params.streamMessage(formatMessageText(text));
            }
            await params.endStreamMessage();

            // Store model response in history
            chatHistory.current.push({
                role: "model",
                parts: [{ text: text }]
            });
        } catch (error: any) {
            console.error("Erro no Gemini Stream:", error);
            const errorMsg = error.message || "erro desconhecido";
            // Clean up history by removing failed user input
            chatHistory.current.pop();
            await params.injectMessage(`Desculpe, tive um problema técnico ao processar sua dúvida (${errorMsg}).`);
        }
    };

    const flow = {
        start: {
            message: "Olá! 👋\n\nSeja bem-vindo(a) à Escola de Pós-Graduação da UFG. Sou a Ana, sua assistente virtual especializada em tirar dúvidas sobre nossos cursos, inscrições, pagamentos e regulamentos.\n\nComo posso ajudar você hoje?",
            options: ["Sou Aluno", "Desejo ser Aluno", "Conversar com a Ana (IA)"],
            path: (params: any) => {
                const input = params.userInput.trim();
                if (input === "Sou Aluno") {
                    return "aluno_menu";
                }
                else if (input === "Desejo ser Aluno") {
                    return "novo_aluno_menu";
                }
                else if (input === "Conversar com a Ana (IA)") {
                    return "conversar_ia_intro";
                }
                return "gemini_loop";
            }
        },

        menu_principal_redirect: {
            message: "Retornando ao menu principal. Escolha uma opção:",
            options: ["Sou Aluno", "Desejo ser Aluno", "Conversar com a Ana (IA)"],
            path: (params: any) => {
                const input = params.userInput.trim();
                if (input === "Sou Aluno") {
                    return "aluno_menu";
                }
                if (input === "Desejo ser Aluno") {
                    return "novo_aluno_menu";
                }
                if (input === "Conversar com a Ana (IA)") {
                    return "conversar_ia_intro";
                }
                return "gemini_loop";
            }
        },

        conversar_ia_intro: {
            message: "Ótimo! Pode digitar qualquer pergunta ou dúvida sobre a pós-graduação da UFG, e eu farei o possível para te ajudar. 💬",
            path: "gemini_loop"
        },

        gemini_loop: {
            message: async (params: any) => {
                await handleGeminiStream(params);
            },
            options: ["Menu Principal", "Falar com a Ana (IA)", "Ver Cursos", "Encerrar Atendimento"],
            path: (params: any) => {
                const input = params.userInput;
                if (input === "Menu Principal") {
                    return "menu_principal_redirect";
                }
                if (input === "Falar com a Ana (IA)") {
                    return "conversar_ia_intro";
                }
                if (input === "Ver Cursos") {
                    return "cursos_menu";
                }
                if (input === "Encerrar Atendimento") {
                    return "end";
                }
                return "gemini_loop";
            }
        },

        pos_resposta_options: {
            message: "Como gostaria de prosseguir?",
            options: ["Voltar ao Menu Principal", "Falar com a Ana (IA)", "Ver Cursos", "Encerrar Atendimento"],
            path: (params: any) => {
                const input = params.userInput;
                if (input === "Voltar ao Menu Principal") {
                    return "menu_principal_redirect";
                }
                if (input === "Falar com a Ana (IA)") {
                    return "conversar_ia_intro";
                }
                if (input === "Ver Cursos") {
                    return "cursos_menu";
                }
                if (input === "Encerrar Atendimento") {
                    return "end";
                }
                return "gemini_loop";
            }
        },

        // =========================
        // POTENCIAL ALUNO
        // =========================

        novo_aluno_menu: {
            message: "Selecione uma opção:",
            options: [
                "Inscrição e matrícula",
                "Sobre os cursos",
                "Formas de pagamento",
                "Modalidade dos cursos",
                "Informações adicionais",
                "Voltar ao Menu Principal"
            ],
            path: (params: any) => {
                switch (params.userInput) {
                    case "Inscrição e matrícula":
                        return "inscricao_menu";
                    case "Sobre os cursos":
                        return "cursos_menu";
                    case "Formas de pagamento":
                        return "pagamento_menu";
                    case "Modalidade dos cursos":
                        return "modalidade";
                    case "Informações adicionais":
                        return "informacoes_adicionais";
                    case "Voltar ao Menu Principal":
                        return "menu_principal_redirect";
                    default:
                        return "gemini_loop";
                }
            }
        },

        // INSCRIÇÃO
        inscricao_menu: {
            message: "Sobre inscrição e matrícula:",
            options: [
                "Procedimento para inscrição",
                "Documentação necessária",
                "Pré-requisitos",
                "Voltar ao Menu Anterior",
                "Voltar ao Menu Principal"
            ],
            path: (params: any) => {
                switch (params.userInput) {
                    case "Procedimento para inscrição":
                        return "procedimento_inscricao";
                    case "Documentação necessária":
                        return "documentacao";
                    case "Pré-requisitos":
                        return "pre_requisitos";
                    case "Voltar ao Menu Anterior":
                        return "novo_aluno_menu";
                    case "Voltar ao Menu Principal":
                        return "menu_principal_redirect";
                    default:
                        return "gemini_loop";
                }
            }
        },

        procedimento_inscricao: {
            message: "Para se inscrever, leia o edital do curso desejado e verifique os critérios de seleção.\n\n" +
                "Depois, siga as orientações do edital para matrícula, incluindo pagamento da taxa e assinatura do contrato, quando aplicável.",
            path: "pos_resposta_options"
        },

        documentacao: {
            message: "Os documentos normalmente exigidos são:\n\n" +
                "• Documento de identificação (RG ou CNH)\n" +
                "• Diploma de curso superior\n" +
                "• Contrato ou termo de compromisso assinado",
            path: "pos_resposta_options"
        },

        pre_requisitos: {
            message: "Sim. Quem está no último semestre pode iniciar o processo usando comprovante de conclusão.\n\n" +
                "O diploma deverá ser apresentado para efetivar a matrícula.",
            path: "pos_resposta_options"
        },

        // CURSOS
        cursos_menu: {
            message: "Sobre os cursos:",
            options: [
                "Diferença entre lato sensu e stricto sensu",
                "Periodicidade das aulas",
                "Aproveitamento de disciplinas",
                "Voltar ao Menu Anterior",
                "Voltar ao Menu Principal"
            ],
            path: (params: any) => {
                switch (params.userInput) {
                    case "Diferença entre lato sensu e stricto sensu":
                        return "modalidades_pos";
                    case "Periodicidade das aulas":
                        return "periodicidade";
                    case "Aproveitamento de disciplinas":
                        return "aproveitamento";
                    case "Voltar ao Menu Anterior":
                        return "novo_aluno_menu";
                    case "Voltar ao Menu Principal":
                        return "menu_principal_redirect";
                    default:
                        return "gemini_loop";
                }
            }
        },

        modalidades_pos: {
            message: "A pós-graduação lato sensu é voltada para especialização profissional.\n\n" +
                "Já a stricto sensu é direcionada para pesquisa acadêmica, como mestrado e doutorado.",
            path: "pos_resposta_options"
        },

        periodicidade: {
            message: "A periodicidade varia conforme o curso.\n\n" +
                "As aulas podem ocorrer semanalmente, quinzenalmente ou mensalmente.",
            path: "pos_resposta_options"
        },

        aproveitamento: {
            message: "Disciplinas cursadas in outro curso lato sensu podem ser aproveitadas, desde que tenham sido concluídas há no máximo dois anos.",
            path: "pos_resposta_options"
        },

        // PAGAMENTO
        pagamento_menu: {
            message: "Sobre pagamentos:",
            options: [
                "Condições de pagamento",
                "Cursos gratuitos",
                "Voltar ao Menu Anterior",
                "Voltar ao Menu Principal"
            ],
            path: (params: any) => {
                switch (params.userInput) {
                    case "Condições de pagamento":
                        return "formas_pagamento";
                    case "Cursos gratuitos":
                        return "gratuitos";
                    case "Voltar ao Menu Anterior":
                        return "novo_aluno_menu";
                    case "Voltar ao Menu Principal":
                        return "menu_principal_redirect";
                    default:
                        return "gemini_loop";
                }
            }
        },

        formas_pagamento: {
            message: "Os cursos podem ser pagos por:\n\n• Boleto bancário\n• Pix",
            path: "pos_resposta_options"
        },

        gratuitos: {
            message: "Sim. Alguns cursos oferecidos pela Escola de Pós UFG são gratuitos.\n\nConsulte a página do curso para verificar disponibilidade.",
            path: "pos_resposta_options"
        },

        // MODALIDADE
        modalidade: {
            message: "A Escola de Pós UFG oferece cursos:\n\n• Presenciais\n• Híbridos\n• EAD",
            path: "pos_resposta_options"
        },

        // INFORMAÇÕES ADICIONAIS
        informacoes_adicionais: {
            message: "Selecione uma opção:",
            options: [
                "Detalhes de um curso",
                "Bolsas de estudo",
                "Diploma tecnólogo",
                "Voltar ao Menu Anterior",
                "Voltar ao Menu Principal"
            ],
            path: (params: any) => {
                switch (params.userInput) {
                    case "Detalhes de um curso":
                        return "curso_especifico";
                    case "Bolsas de estudo":
                        return "bolsas";
                    case "Diploma tecnólogo":
                        return "tecnologo";
                    case "Voltar ao Menu Anterior":
                        return "novo_aluno_menu";
                    case "Voltar ao Menu Principal":
                        return "menu_principal_redirect";
                    default:
                        return "gemini_loop";
                }
            }
        },

        curso_especifico: {
            message: "Você pode consultar a página oficial do curso ou entrar em contato com a Escola de Pós UFG por telefone, WhatsApp ou e-mail.",
            path: "pos_resposta_options"
        },

        bolsas: {
            message: "Alguns cursos oferecem bolsas ou isenção de mensalidades para servidores da UFG e grupos minorizados, conforme previsto em edital.",
            path: "pos_resposta_options"
        },

        tecnologo: {
            message: "Sim. Diplomas de cursos superiores de tecnologia são aceitos para MBA e pós-graduação.",
            path: "pos_resposta_options"
        },

        // =========================
        // ALUNO
        // =========================

        aluno_menu: {
            message: "Selecione sua dúvida:",
            options: [
                "Trancamento",
                "Mudança de curso",
                "Cancelamento",
                "Comunicação com professor",
                "Matrícula",
                "Requisitos acadêmicos",
                "Certificação",
                "Voltar ao Menu Principal"
            ],
            path: (params: any) => {
                switch (params.userInput) {
                    case "Trancamento":
                        return "trancamento";
                    case "Mudança de curso":
                        return "mudanca";
                    case "Cancelamento":
                        return "cancelamento";
                    case "Comunicação com professor":
                        return "comunicacao";
                    case "Matrícula":
                        return "matricula";
                    case "Requisitos acadêmicos":
                        return "requisitos";
                    case "Certificação":
                        return "certificacao";
                    case "Voltar ao Menu Principal":
                        return "menu_principal_redirect";
                    default:
                        return "gemini_loop";
                }
            }
        },

        trancamento: {
            message: "Não há possibilidade de trancamento de matrícula, conforme o Regulamento Geral da Pós-Graduação Lato Sensu da UFG.",
            path: "pos_resposta_options"
        },

        mudanca: {
            message: "Sim. É possível mudar de curso, desde que você participe do processo seletivo do novo curso e siga as regras do edital.",
            path: "pos_resposta_options"
        },

        cancelamento: {
            message: "Sim. O cancelamento pode ser realizado conforme as regras previstas em contrato.",
            path: "pos_resposta_options"
        },

        comunicacao: {
            message: "Os alunos podem entrar em contato com professores pelo sistema acadêmico, e-mail ou ambiente virtual de aprendizagem.",
            path: "pos_resposta_options"
        },

        matricula: {
            message: "Para dúvidas sobre matrícula, entre em contato com a coordenação do curso pelo e-mail disponível na página oficial.",
            path: "pos_resposta_options"
        },

        requisitos: {
            message: "Os requisitos acadêmicos normalmente incluem:\n\n• Frequência mínima de 75%\n• Nota mínima 7,0\n• Aprovação no TCC, quando obrigatório",
            path: "pos_resposta_options"
        },

        certificacao: {
            message: "Para solicitar o certificado de conclusão, entre em contato com a coordenação do curso e verifique se todos os requisitos acadêmicos foram atendidos.",
            path: "pos_resposta_options"
        },

        end: {
            message: "Obrigado pelo contato 😊\n\nA Escola de Pós-Graduação da UFG deseja muito sucesso na sua trajetória acadêmica e profissional.",
            options: ["Reiniciar Atendimento"],
            path: "start"
        }
    };

    const settings = {
        general: {
            embedded: true,
            primaryColor: "#003366",
            secondaryColor: "#0055AA",
            showFooter: false
        },
        header: {
            title: "Escola de Pós UFG",
            showAvatar: true
        },
        botBubble: {
            simulateStream: false
        },
        notification: {
            disabled: true
        },
        chatInput: {
            enabledPlaceholderText: "Digite sua dúvida..."
        }
    };

    return (
        <ChatBot
            settings={settings}
            flow={flow}
        />
    );
};

export default ChatEscolaPos;