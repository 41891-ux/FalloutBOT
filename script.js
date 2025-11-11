class FalloutBot {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.chatHistory = [];
        
        this.initializeEventListeners();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);
    }

    initializeEventListeners() {
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const chatMessages = document.getElementById('chat-messages');

        // Send message on button click
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Send message on Enter key
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Auto-focus input
        userInput.focus();
    }

    updateDateTime() {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('current-date').textContent = 
            `${dateString} ${timeString}`;
    }

    async sendMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();

        if (!message) return;

        // Clear input
        userInput.value = '';

        // Add user message to chat
        this.addMessage('user', message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callDeepSeekAPI(message);
            this.removeTypingIndicator();
            this.addMessage('bot', response);
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('system', `ERRO: ${error.message}`);
            console.error('API Error:', error);
        }
    }

    async callDeepSeekAPI(userMessage) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Fallout-BOT Terminal'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3.1:free',
                messages: [
                    {
                        role: 'system',
                        content: `Você é o Fallout-BOT, um assistente de IA com personalidade no universo Fallout. 
                        Responda como um terminal do Vault-Tec, com um tom profissional mas com elementos do lore Fallout.
                        Use formatação simples, sem markdown. Seja útil e direto nas respostas.`
                    },
                    ...this.chatHistory,
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const botMessage = data.choices[0].message.content;
            
            // Update chat history
            this.chatHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botMessage }
            );

            // Keep only last 10 messages to manage context
            if (this.chatHistory.length > 20) {
                this.chatHistory = this.chatHistory.slice(-20);
            }

            return botMessage;
        } else {
            throw new Error('Resposta inválida da API');
        }
    }

    addMessage(sender, text) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="text">${this.escapeHtml(text)}</span>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing-indicator';
        
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        typingDiv.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="text typing">FALLOUT-BOT PROCESSANDO</span>
        `;

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FalloutBot();
});

// Add some terminal-like effects
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        document.getElementById('chat-messages').innerHTML = `
            <div class="message system">
                <span class="timestamp">[SYSTEM]</span>
                <span class="text">TERMINAL CLEARED</span>
            </div>
        `;
    }
});