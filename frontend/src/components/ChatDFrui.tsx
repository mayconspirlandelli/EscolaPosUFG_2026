import ChatBot from "react-chatbotify";
import "@/styles/chatbot.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRef } from "react";

const ChatDFrui = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

    // Estado para armazenar dados da checagem atual
    const checkData = useRef({
        content: "",
        context: "",
        rating: ""
    });

    const SYSTEM_MESSAGE = 
      "Você é um assistente virtual chamado Ana especializado na Escola de Pós-Graduação da UFG e na UFG."
        "Responda a cada PERGUNTA de forma clara, objetiva e educada, usando apenas as informações do CONTEXTO." 
        "Instruções"  
        "1.Seja direto: Dê respostas curtas e informativas, evitando detalhes desnecessários."  
        "2.Mantenha o foco: Se a pergunta não for sobre a Escola de Pós-Graduação da UFG ou a UFG, responda de forma educada e direcione o usuário para temas nos quais você pode ajudar."
        "3.Erros de digitação**: Se a pergunta não fizer sentido, sugira que o usuário reformule." 
        "4.Interações curtas: Seja breve e educado. Não faça perguntas ao usuário, a menos que seja necessário."
        "5.Respostas educadas: Sempre seja educado e profissional, mesmo se o usuário não for."
        "6. Não responda fora do contexto: Responda apenas com base nas informações fornecidas no contexto."
        "PERGUNTA: {input}"
        "CONTEXTO: `{context}";

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

    const handleGeminiCheck = async (params: any) => {
        try {
            if (!apiKey) {
                await params.injectMessage("Erro: Chave de API não configurada no ambiente.");
                return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_MESSAGE
            });

            const prompt = `
                CONTEÚDO PARA CHECAGEM:
                "${checkData.current.content}"

                CONTEXTO ADICIONAL:
                "${checkData.current.context}"

                Por favor, analise e formate a resposta conforme o padrão:
                **✅ Resultado da Checagem**
                [Sua análise aqui, destacando se há evidências oficiais e se há manipulação/descontextualização]

                **🔎 Confira a análise completa:**
                https://daurora.com.br/checagem/${Math.floor(Math.random() * 100000)}
                `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            await params.injectMessage(formatMessageText(responseText));
        } catch (error: any) {
            console.error("Erro na checagem:", error);
            await params.injectMessage("Desculpe, tive um problema técnico ao analisar essa informação. Por favor, tente novamente em instantes.");
        }
    };

    const flow = {
        start: {
            message: "Olá! 👋\n\nSou o dFrui, seu assistente de checagem de desinformação, golpes e fraudes digitais.\n\nEstou aqui para ajudar você a verificar conteúdos suspeitos de forma simples, rápida e confiável.\n\n🔒 Este atendimento segue as diretrizes da LGPD (Lei Geral de Proteção de Dados). Seus dados serão utilizados apenas para fins de análise e melhoria do serviço.\n\nPosso ajudar na checagem de:\n\n• Textos\n• Áudios\n• Vídeos\n• Imagens\n\nEnvie o conteúdo que deseja verificar.",
            path: "content_submission"
        },
        content_submission: {
            transition: { duration: 0 },
            path: (params: any) => {
                if (!params.userInput.trim()) {
                    return "start";
                }
                checkData.current.content = params.userInput;
                return "ask_origin";
            }
        },
        ask_origin: {
            message: "Entendi! Para uma análise precisa, onde você recebeu essa informação? 📍",
            options: ["WhatsApp", "Instagram", "TikTok", "Facebook", "Portal de Notícias", "Outro"],
            path: (params: any) => {
                checkData.current.context = `Origem: ${params.userInput}. `;
                return "ask_source";
            }
        },
        ask_source: {
            message: "A mensagem cita alguma fonte ou órgão oficial? (Ex: Ministério da Saúde, G1, etc.) 🏛️",
            options: ["Sim", "Não", "Não sei informar"],
            path: (params: any) => {
                checkData.current.context += `Fonte citada: ${params.userInput}. `;
                return "ask_goal";
            }
        },
        ask_goal: {
            message: "O que você deseja verificar especificamente? 🎯",
            options: ["Inverdade (falsidade)", "Descontextualizado (fora de contexto)", "Ilícito (ou ataque)", "Golpe (ou fraude)", "Outro"],
            path: (params: any) => {
                checkData.current.context += `Objetivo: ${params.userInput}.`;
                return "processing_message";
            }
        },
        processing_message: {
            message: "Perfeito 👍\n\nEstou analisando o conteúdo enviado e verificando fontes confiáveis. Isso pode levar alguns instantes...",
            transition: { duration: 1500 },
            path: async (params: any) => {
                await handleGeminiCheck(params);
                return "validate_experience";
            }
        },
        validate_experience: {
            message: "A resposta atendeu sua expectativa sobre a checagem? 😊",
            options: ["Não", "Sim"],
            path: (params: any) => {
                if (params.userInput === "Sim") {
                    return "new_request_check";
                }
                return "ask_clarification";
            }
        },
        ask_clarification: {
            message: "Lamento que a resposta não tenha sido suficiente. 😔 O que não ficou claro para você ou que informação adicional você gostaria de saber?",
            path: (params: any) => {
                checkData.current.context += `\nDúvida do usuário: ${params.userInput}`;
                return "reprocessing_message";
            }
        },
        reprocessing_message: {
            message: "Entendi! Vou reanalisar o conteúdo com base na sua dúvida. Só um momento...",
            transition: { duration: 1500 },
            path: async (params: any) => {
                await handleGeminiCheck(params);
                return "validate_experience";
            }
        },
        new_request_check: {
            message: "Fico feliz em ajudar 🙌\n\nVocê deseja verificar mais algum conteúdo?",
            options: ["Não", "Sim"],
            path: (params: any) => {
                if (params.userInput === "Sim") {
                    checkData.current = { content: "", context: "", rating: "" };
                    return "processing_message";
                }
                return "rating_prompt";
            }
        },
        rating_prompt: {
            message: "Tudo bem 😊\n\nAntes de encerrar, você poderia avaliar meu atendimento de 0 a 5?",
            options: ["0", "1", "2", "3", "4", "5"],
            path: "rating_submission"
        },
        rating_submission: {
            transition: { duration: 0 },
            path: (params: any) => {
                checkData.current.rating = params.userInput;
                return "final_thanks";
            }
        },
        final_thanks: {
            message: "Muito obrigado pela sua avaliação ⭐\n\nSua participação ajuda a melhorar continuamente o serviço de checagem e combate à desinformação.",
            transition: { duration: 1000 },
            path: "social_invite"
        },
        social_invite: {
            message: "📲 Quer acompanhar mais conteúdos sobre combate à desinformação, educação midiática e checagem de fatos?\n\nSiga o projeto dAurora nas redes sociais:",
            options: ["Instagram", "LinkedIn", "Site", "Não, obrigado(a)"],
            path: (params: any) => {
                const input = params.userInput;
                if (input === "Instagram") {
                    window.open("https://www.instagram.com/daurora_ufg", "_blank");
                }
                if (input === "LinkedIn") {
                    window.open("https://www.linkedin.com/in/d-aurora-0208a1354/", "_blank");
                }
                if (input === "Site") {
                    window.open("https://www.daurora.inf.ufg.br/", "_blank");
                }
                if (input === "Não, obrigado(a)") {
                    return "closing_message";
                }
                return "closing_message";
            }
        },
        closing_message: {
            message: "Sempre que precisar, estarei disponível para ajudar 😊\n\nAté logo!",
            options: ["Reiniciar Atendimento"],
            path: "start"
        }
    };

    const settings = {
        general: {
            embedded: true,
            primaryColor: "#3FB8AF",
            secondaryColor: "#FF7C33",
            showFooter: false
        },
        header: {
            title: "dFrui",
            showAvatar: true,
        },
        botBubble: {
            simulateStream: false
        },
        notification: {
            disabled: true
        },
        chatInput: {
            enabledPlaceholderText: "Escreva aqui..."
        }
    };

    const themes = [
        { id: "chatbot_daurora", version: "0.1.0" }
    ];

    return (
        <ChatBot
            settings={settings}
            flow={flow}
            themes={themes}
        />
    );
};

export default ChatDFrui;
