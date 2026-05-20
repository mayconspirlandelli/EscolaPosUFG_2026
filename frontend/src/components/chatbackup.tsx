import ChatBot from "react-chatbotify";
import "@/styles/chatbot.css";
import LlmConnector, { GeminiProvider } from "@rcb-plugins/llm-connector";

const MyChatBot = () => {
    // gemini api key, carregada do arquivo .env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // initialize the plugin
    const plugins = [LlmConnector()];

    // example flow for testing
    const flow: any = {
        start: {
            message: "Olá! Eu sou o *Argos*, seu assistente de checagem de informações.\n\nRecebo textos, áudios, vídeos ou links e digo se a informação é verdadeira, falsa ou não verificável — de forma rápida e sem complicação.\n\nMande o conteúdo que quiser verificar e eu cuido do resto. 🔍",
            options: ["Estou pronto!"],
            chatDisabled: true,
            path: async (params: any) => {
                if (!apiKey) {
                    await params.simulateStreamMessage("Você ainda não configurou sua chave de API Gemini!");
                    return "start";
                }
                await params.simulateStreamMessage("Pode perguntar qualquer coisa!");
                return "gemini";
            },
        },
        gemini: {
            llmConnector: {
                provider: new GeminiProvider({
                    mode: 'direct',
                    model: 'gemini-3.1-flash-preview',
                    responseFormat: 'stream',
                    apiKey: apiKey,
                    systemMessage: `Você é o Argos, um assistente especializado em checagem de fatos (fact-checking). 
Sua missão é analisar as informações enviadas pelo usuário e determinar se são VERÍDICAS ou INVERÍDICAS, fornecendo uma breve explicação baseada em fatos.

Abaixo estão alguns exemplos de como você deve responder:

Exemplo 1:
Entrada: URGENTE: Chá de erva-doce cura o coronavírus em 24 horas, dizem especialistas da China!
Saída: Esta notícia é INVERÍDICA. Não há comprovação científica de que o chá de erva-doce cure o COVID-19. Organizações de saúde como a OMS desmentiram boatos similares.

Exemplo 2:
Entrada: O governo anunciou hoje o novo calendário de pagamentos do Bolsa Família para o mês de abril.
Saída: Esta notícia é VERÍDICA. O calendário oficial foi divulgado pelos canais do Governo Federal e da Caixa Econômica Federal.

Exemplo 3:
Entrada: Vídeo mostra neve caindo em plena Avenida Paulista em São Paulo nesta tarde de verão!
Saída: Esta notícia é INVERÍDICA. Não houve registro de neve em São Paulo recentemente, e as condições climáticas de verão tornam isso impossível. O vídeo provavelmente é manipulado ou de outro local/época.

Sempre responda de forma direta, educada e baseada em evidências.`
                }),
                outputType: 'character',
            },
        },
    };

    const settings = {
        general: {
            embedded: true,
            primaryColor: "#FF6801",
            secondaryColor: "#daedf2",
            showFooter: false
        },
        chatHistory: {
            storageKey: "example_gemini_integration"
        },
        header: {
            showAvatar: true,
            avatar: "../assets/bot.svg",
            title: "Argos"
        },
        notification: {
            defaultToggledOn: false
        }
    };

    const themes = [
        { id: "chatbot_daurora", version: "0.1.0" }
    ];

    return (
        <ChatBot
            settings={settings}
            plugins={plugins}
            flow={flow}
            themes={themes}
        />
    );
};

export default MyChatBot;
