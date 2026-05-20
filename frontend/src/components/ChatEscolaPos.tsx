import ChatBot from "react-chatbotify";

import "@/styles/chatbot.css";

const ChatEscolaPos = () => {

    const flow = {

        start: {

            message:

                "Olá! 👋\n\n" +

                "Seja bem-vindo(a) à Escola de Pós-Graduação da UFG.\n\n" +

                "Chegar até aqui já demonstra seu interesse em expandir horizontes e transformar sua carreira profissional.\n\n" +

                "Como posso ajudar você hoje?",

            options: [

                "Já sou aluno",

                "Desejo ser aluno"

            ],

            path: (params: any) => {

                if (params.userInput === "Já sou aluno") {

                    return "aluno_menu";

                }

                return "novo_aluno_menu";

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

                "Informações adicionais"

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

                    default:

                        return "informacoes_adicionais";

                }

            }

        },

        // INSCRIÇÃO

        inscricao_menu: {

            message: "Sobre inscrição e matrícula:",

            options: [

                "Procedimento para inscrição",

                "Documentação necessária",

                "Pré-requisitos"

            ],

            path: (params: any) => {

                switch (params.userInput) {

                    case "Procedimento para inscrição":

                        return "procedimento_inscricao";

                    case "Documentação necessária":

                        return "documentacao";

                    default:

                        return "pre_requisitos";

                }

            }

        },

        procedimento_inscricao: {

            message:

                "Para se inscrever, leia o edital do curso desejado e verifique os critérios de seleção.\n\n" +

                "Depois, siga as orientações do edital para matrícula, incluindo pagamento da taxa e assinatura do contrato, quando aplicável.",

            path: "restart"

        },

        documentacao: {

            message:

                "Os documentos normalmente exigidos são:\n\n" +

                "• Documento de identificação (RG ou CNH)\n" +

                "• Diploma de curso superior\n" +

                "• Contrato ou termo de compromisso assinado",

            path: "restart"

        },

        pre_requisitos: {

            message:

                "Sim. Quem está no último semestre pode iniciar o processo usando comprovante de conclusão.\n\n" +

                "O diploma deverá ser apresentado para efetivar a matrícula.",

            path: "restart"

        },

        // CURSOS

        cursos_menu: {

            message: "Sobre os cursos:",

            options: [

                "Diferença entre lato sensu e stricto sensu",

                "Periodicidade das aulas",

                "Aproveitamento de disciplinas"

            ],

            path: (params: any) => {

                switch (params.userInput) {

                    case "Diferença entre lato sensu e stricto sensu":

                        return "modalidades_pos";

                    case "Periodicidade das aulas":

                        return "periodicidade";

                    default:

                        return "aproveitamento";

                }

            }

        },

        modalidades_pos: {

            message:

                "A pós-graduação lato sensu é voltada para especialização profissional.\n\n" +

                "Já a stricto sensu é direcionada para pesquisa acadêmica, como mestrado e doutorado.",

            path: "restart"

        },

        periodicidade: {

            message:

                "A periodicidade varia conforme o curso.\n\n" +

                "As aulas podem ocorrer semanalmente, quinzenalmente ou mensalmente.",

            path: "restart"

        },

        aproveitamento: {

            message:

                "Disciplinas cursadas em outro curso lato sensu podem ser aproveitadas, desde que tenham sido concluídas há no máximo dois anos.",

            path: "restart"

        },

        // PAGAMENTO

        pagamento_menu: {

            message: "Sobre pagamentos:",

            options: [

                "Condições de pagamento",

                "Cursos gratuitos"

            ],

            path: (params: any) => {

                if (params.userInput === "Condições de pagamento") {

                    return "formas_pagamento";

                }

                return "gratuitos";

            }

        },

        formas_pagamento: {

            message:

                "Os cursos podem ser pagos por:\n\n" +

                "• Boleto bancário\n" +

                "• Pix",

            path: "restart"

        },

        gratuitos: {

            message:

                "Sim. Alguns cursos oferecidos pela Escola de Pós UFG são gratuitos.\n\n" +

                "Consulte a página do curso para verificar disponibilidade.",

            path: "restart"

        },

        // MODALIDADE

        modalidade: {

            message:

                "A Escola de Pós UFG oferece cursos:\n\n" +

                "• Presenciais\n" +

                "• Híbridos\n" +

                "• EAD",

            path: "restart"

        },

        // INFORMAÇÕES ADICIONAIS

        informacoes_adicionais: {

            message: "Selecione uma opção:",

            options: [

                "Detalhes de um curso",

                "Bolsas de estudo",

                "Diploma tecnólogo"

            ],

            path: (params: any) => {

                switch (params.userInput) {

                    case "Detalhes de um curso":

                        return "curso_especifico";

                    case "Bolsas de estudo":

                        return "bolsas";

                    default:

                        return "tecnologo";

                }

            }

        },

        curso_especifico: {

            message:

                "Você pode consultar a página oficial do curso ou entrar em contato com a Escola de Pós UFG por telefone, WhatsApp ou e-mail.",

            path: "restart"

        },

        bolsas: {

            message:

                "Alguns cursos oferecem bolsas ou isenção de mensalidades para servidores da UFG e grupos minorizados, conforme previsto em edital.",

            path: "restart"

        },

        tecnologo: {

            message:

                "Sim. Diplomas de cursos superiores de tecnologia são aceitos para MBA e pós-graduação.",

            path: "restart"

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

                "Certificação"

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

                    default:

                        return "certificacao";

                }

            }

        },

        trancamento: {

            message:

                "Não há possibilidade de trancamento de matrícula, conforme o Regulamento Geral da Pós-Graduação Lato Sensu da UFG.",

            path: "restart"

        },

        mudanca: {

            message:

                "Sim. É possível mudar de curso, desde que você participe do processo seletivo do novo curso e siga as regras do edital.",

            path: "restart"

        },

        cancelamento: {

            message:

                "Sim. O cancelamento pode ser realizado conforme as regras previstas em contrato.",

            path: "restart"

        },

        comunicacao: {

            message:

                "Os alunos podem entrar em contato com professores pelo sistema acadêmico, e-mail ou ambiente virtual de aprendizagem.",

            path: "restart"

        },

        matricula: {

            message:

                "Para dúvidas sobre matrícula, entre em contato com a coordenação do curso pelo e-mail disponível na página oficial.",

            path: "restart"

        },

        requisitos: {

            message:

                "Os requisitos acadêmicos normalmente incluem:\n\n" +

                "• Frequência mínima de 75%\n" +

                "• Nota mínima 7,0\n" +

                "• Aprovação no TCC, quando obrigatório",

            path: "restart"

        },

        certificacao: {

            message:

                "Para solicitar o certificado de conclusão, entre em contato com a coordenação do curso e verifique se todos os requisitos acadêmicos foram atendidos.",

            path: "restart"

        },

        // =========================

        // REINICIAR

        // =========================

        restart: {

            message: "Posso ajudar em mais alguma coisa?",

            options: [

                "Sim",

                "Não"

            ],

            path: (params: any) => {

                if (params.userInput === "Sim") {

                    return "start";

                }

                return "end";

            }

        },

        end: {

            message:

                "Obrigado pelo contato 😊\n\n" +

                "A Escola de Pós-Graduação da UFG deseja muito sucesso na sua trajetória acadêmica e profissional.",

            chatDisabled: true

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