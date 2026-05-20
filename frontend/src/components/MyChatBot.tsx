import ChatBot from "react-chatbotify";
import "@/styles/chatbot.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { useRef } from "react";

const MyChatBot = () => {
	// Usamos useRef para persistir os valores entre renderizações sem disparar re-renders desnecessários
	const apiKeyRef = useRef(import.meta.env.VITE_GEMINI_API_KEY || null);
	const modelType = useRef(import.meta.env.VITE_GEMINI_MODEL || "gemini-3.1-flash");
	const hasErrorRef = useRef(false);

	const SYSTEM_MESSAGE = `Você é o Argos, um assistente especializado em checagem de fatos (fact-checking). 
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

Sempre responda de forma direta, educada e baseada em evidências.`;

	const gemini_stream = async (params: any) => {
		try {
			if (!apiKeyRef.current) {
				throw new Error("API Key is missing");
			}
			const genAI = new GoogleGenerativeAI(apiKeyRef.current);
			const model = genAI.getGenerativeModel({
				model: modelType.current,
				systemInstruction: SYSTEM_MESSAGE
			});
			const result = await model.generateContentStream(params.userInput);

			let text = "";
			let offset = 0;
			for await (const chunk of result.stream) {
				const chunkText = chunk.text();
				text += chunkText;
				for (let i = offset; i < chunkText.length; i++) {
					await params.streamMessage(text.slice(0, i + 1));
					await new Promise(resolve => setTimeout(resolve, 30));
				}
				offset += chunkText.length;
			}

			for (let i = offset; i < text.length; i++) {
				await params.streamMessage(text.slice(0, i + 1));
				await new Promise(resolve => setTimeout(resolve, 30));
			}
			await params.streamMessage(text);
			await params.endStreamMessage();
		} catch (error: any) {
			console.error("Erro no Gemini Stream:", error);
			await params.injectMessage(`Ops! Ocorreu um erro: ${error.message || error}. Verifique se sua chave de API é válida e se o modelo '${modelType.current}' está disponível.`);
			hasErrorRef.current = true;
		}
	}

	const flow = {
		start: {
			message: "Olá! Eu sou o *Argos*, seu assistente de checagem de informações.\n\nRecebo textos, áudios, vídeos ou links e digo se a informação é verdadeira, falsa ou não verificável — de forma rápida e sem complicação. 🔍",
			path: () => {
				if (apiKeyRef.current) {
					return "loop";
				}
				return "api_key_prompt";
			}
		},
		api_key_prompt: {
			message: "Para começar, por favor insira sua chave de API do Gemini (ou configure-a no arquivo .env):",
			path: "api_key_input",
			isSensitive: true
		},
		api_key_input: {
			message: (params: any) => {
				apiKeyRef.current = params.userInput.trim();
				return "Chave configurada! Como posso te ajudar hoje?";
			},
			path: "loop",
		},
		loop: {
			message: async (params: any) => {
				await gemini_stream(params);
			},
			path: () => {
				if (hasErrorRef.current) {
					hasErrorRef.current = false; // Reseta o erro para permitir nova tentativa
					return "api_key_prompt";
				}
				return "loop";
			}
		}
	};

	const settings = {
		general: {
			embedded: true,
			primaryColor: "#FF6801",
			secondaryColor: "#daedf2",
			showFooter: false
		},
		chatHistory: {
			storageKey: "argos_chat_history"
		},
		header: {
			showAvatar: true,
			avatar: "../assets/bot.svg",
			title: "Argos"
		},
		botBubble: {
			simulateStream: true
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

export default MyChatBot;
